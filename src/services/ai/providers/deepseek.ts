import {
  createCancelledError,
  createRetryableError,
  getAiTimeoutMs,
  throwApiResponseError,
  throwIfCancelled,
  TRUNCATED_RESPONSE_MESSAGE,
} from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

const API_BASE = 'https://api.deepseek.com';
export const DEEPSEEK_BALANCE_MESSAGE =
  'DeepSeek balance is insufficient. Add credit in the DeepSeek platform and try again.';
export const DEEPSEEK_EMPTY_MESSAGE =
  'DeepSeek returned an empty response. Please try again.';
const UNREADABLE_RESPONSE_MESSAGE =
  'DeepSeek returned an unreadable response. Please try again.';

// One deadline covers headers AND the non-streaming response body. DeepSeek
// may keep a request open before the final JSON is available, so cancelling
// only fetch() would leave response.json() running after the user stops a job.
const requestDeepSeek = async (
  path: string,
  apiKey: string,
  body: Record<string, unknown> | undefined,
  timeoutMs: number,
  cancelSignal?: AbortSignal
): Promise<unknown> => {
  throwIfCancelled(cancelSignal);
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCancel = (): void => controller.abort();
  cancelSignal?.addEventListener('abort', onCancel, { once: true });

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    if (response.status === 402) throw new Error(DEEPSEEK_BALANCE_MESSAGE);
    if (!response.ok) await throwApiResponseError('DeepSeek', response);

    let result: unknown;
    try {
      result = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw createRetryableError(UNREADABLE_RESPONSE_MESSAGE);
    }
    throwIfCancelled(cancelSignal);
    return result;
  } catch (error) {
    if (cancelSignal?.aborted) throw createCancelledError();
    if (timedOut || (error instanceof DOMException && error.name === 'AbortError')) {
      throw createRetryableError('Request timed out. Please try again.');
    }
    if (error instanceof TypeError) {
      throw createRetryableError(
        "Couldn't reach the AI service. Check your internet connection and try again. If it keeps failing, the model may be overloaded — try a more reliable model or provider."
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    cancelSignal?.removeEventListener('abort', onCancel);
  }
};

interface DeepSeekModel {
  id: string;
  name?: unknown;
  max_output_tokens?: unknown;
}

const isModel = (value: unknown): value is DeepSeekModel =>
  typeof value === 'object' && value !== null &&
  typeof (value as DeepSeekModel).id === 'string' && (value as DeepSeekModel).id.trim().length > 0;

export const fetchDeepSeekModels = async (apiKey: string): Promise<ModelOption[]> => {
  const result = await requestDeepSeek('/models', apiKey, undefined, getAiTimeoutMs());
  const data = result as { data?: unknown } | null;
  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from DeepSeek models endpoint');
  }

  // Discover live model IDs and output budgets instead of maintaining a list
  // that becomes obsolete when DeepSeek retires or renames a model.
  const seen = new Set<string>();
  return data.data.filter(isModel).filter(model => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  }).map(model => ({
    id: model.id,
    name: typeof model.name === 'string' && model.name.trim() ? model.name : model.id,
    ...(Number.isSafeInteger(model.max_output_tokens) && Number(model.max_output_tokens) > 0 && {
      maxOutputTokens: Number(model.max_output_tokens),
    }),
  })).sort((a, b) => a.id.localeCompare(b.id));
};

export const callDeepSeek = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number,
  bookmarkCount?: number,
  expectJson = false,
  cancelSignal?: AbortSignal
): Promise<string> => {
  const result = await requestDeepSeek('/chat/completions', apiKey, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
    // Bookmark classification needs a final path/JSON, not a reasoning trace.
    thinking: { type: 'disabled' },
    ...(maxTokens !== undefined && { max_tokens: maxTokens }),
    ...(expectJson && { response_format: { type: 'json_object' } }),
  }, getAiTimeoutMs(bookmarkCount), cancelSignal);

  const data = result as { choices?: Array<{ finish_reason?: string; message?: { content?: unknown } }> } | null;
  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error(TRUNCATED_RESPONSE_MESSAGE);
  const content = choice?.message?.content;
  // JSON mode can return only U+0020 spaces even with finish_reason=stop.
  // Treat it as retryable; never substitute reasoning_content for the answer.
  if (typeof content !== 'string' || !content.trim()) {
    throw createRetryableError(DEEPSEEK_EMPTY_MESSAGE);
  }
  return content.trim();
};
