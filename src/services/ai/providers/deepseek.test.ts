import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callDeepSeek, DEEPSEEK_BALANCE_MESSAGE, DEEPSEEK_EMPTY_MESSAGE, fetchDeepSeekModels } from './deepseek';
import { callProvider, fetchModelsForProvider } from '../providerUtils';
import { getAiTimeoutMs, TRUNCATED_RESPONSE_MESSAGE } from '../../../utils/helpers';

const apiKey = 'sk-test-1234567890abcdef';
const chatReply = (content: unknown, finishReason = 'stop') => new Response(JSON.stringify({
  choices: [{ finish_reason: finishReason, message: { content, reasoning_content: 'not a final answer' } }],
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DeepSeek model discovery', () => {
  it('loads live model IDs, display names, and output limits without a model allowlist', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', max_output_tokens: 393216 },
      { id: 'deepseek-flash', name: 'DeepSeek Flash', max_output_tokens: 393216 },
      { id: 'future-model', max_output_tokens: -1 },
      { id: 'deepseek-flash', name: 'duplicate' },
      { id: '' }, null, { id: 123 },
    ] })));
    vi.stubGlobal('fetch', fetchMock);

    const models = await fetchModelsForProvider('deepseek', apiKey);

    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/models', expect.objectContaining({
      method: 'GET', headers: { Authorization: `Bearer ${apiKey}` }, signal: expect.any(AbortSignal),
    }));
    expect(models).toEqual([
      { id: 'deepseek-flash', name: 'DeepSeek Flash', maxOutputTokens: 393216 },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', maxOutputTokens: 393216 },
      { id: 'future-model', name: 'future-model' },
    ]);
  });

  it('rejects an invalid model-list shape', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"data":{}}')));
    await expect(fetchDeepSeekModels(apiKey)).rejects.toThrow('Unexpected response from DeepSeek models endpoint');
  });

  it('reports insufficient balance separately from an invalid key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 402 })));
    await expect(fetchDeepSeekModels(apiKey)).rejects.toMatchObject({ message: DEEPSEEK_BALANCE_MESSAGE });
  });
});

describe('DeepSeek chat requests', () => {
  it('uses plain text for single-page folder paths and the selected model unchanged', async () => {
    const fetchMock = vi.fn(async () => chatReply('  NEW: 我的资料  '));
    vi.stubGlobal('fetch', fetchMock);

    expect(await callProvider('deepseek', apiKey, 'system', 'user', 'future-model', 8192, 1)).toBe('NEW: 我的资料');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` });
    expect(body).toEqual({
      model: 'future-model', messages: [{ role: 'system', content: 'system' }, { role: 'user', content: 'user' }],
      stream: false, thinking: { type: 'disabled' }, max_tokens: 8192,
    });
    expect(body).not.toHaveProperty('response_format');
  });

  it('enables official JSON output only for bulk requests', async () => {
    const fetchMock = vi.fn(async () => chatReply('{"folders":[],"assignments":[]}'));
    vi.stubGlobal('fetch', fetchMock);

    await callProvider('deepseek', apiKey, 'Return JSON', 'JSON example', 'deepseek-flash', undefined, 50, true);

    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body).not.toHaveProperty('max_tokens');
  });

  it('treats whitespace-only JSON-mode output as retryable and never returns reasoning text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => chatReply('     ')));
    await expect(callDeepSeek(apiKey, 'JSON', 'JSON', 'deepseek-flash', undefined, 5, true))
      .rejects.toMatchObject({ message: DEEPSEEK_EMPTY_MESSAGE, retryable: true });
  });

  it('reports a truncated reply instead of applying incomplete results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => chatReply('{"folders":', 'length')));
    await expect(callDeepSeek(apiKey, 'JSON', 'JSON', 'deepseek-flash'))
      .rejects.toThrow(TRUNCATED_RESPONSE_MESSAGE);
  });

  it('reports malformed response JSON as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json')));
    await expect(callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash'))
      .rejects.toMatchObject({ message: 'DeepSeek returned an unreadable response. Please try again.', retryable: true });
  });

  it.each([429, 500, 503])('marks HTTP %s as retryable without exposing raw provider details', async status => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"private diagnostic"}}', { status })));
    const error = await callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash').catch(error => error);
    expect(error.retryable).toBe(true);
    expect(error.message).not.toContain('private diagnostic');
  });

  it('keeps authentication failures non-retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"invalid api key"}}', { status: 401 })));
    const error = await callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash').catch(error => error);
    expect(error.message).toContain('Invalid API key');
    expect(error.retryable).toBe(false);
  });
});

describe('DeepSeek cancellation and deadlines', () => {
  it('does not start a request that was already cancelled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    await expect(callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash', undefined, 1, false, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels a pending body even after response headers have arrived', async () => {
    const readBody = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => ({
      ok: true, status: 200,
      json: () => {
        readBody();
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        });
      },
    })));
    const controller = new AbortController();
    const request = callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash', undefined, 1, false, controller.signal);
    await vi.waitFor(() => expect(readBody).toHaveBeenCalled());
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('times out the complete response body, not only the initial fetch', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => ({
      ok: true, status: 200,
      json: () => new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      }),
    })));
    const request = callDeepSeek(apiKey, 'system', 'user', 'deepseek-flash');
    const assertion = expect(request).rejects.toMatchObject({ message: 'Request timed out. Please try again.', retryable: true });
    await vi.advanceTimersByTimeAsync(getAiTimeoutMs() + 1);
    await assertion;
  });
});
