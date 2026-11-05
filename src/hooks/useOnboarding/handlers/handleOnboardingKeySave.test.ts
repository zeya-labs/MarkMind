import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchModelsForProvider } from '../../../services/ai/providerUtils';
import {
  getSelectedModelId,
  getSelectedServiceId,
  setSelectedModelId,
  setSelectedServiceId,
} from '../../../services/selectedState';
import { createHandleOnboardingKeySave } from './handleOnboardingKeySave';

vi.mock('../../../services/ai/providerUtils', () => ({ fetchModelsForProvider: vi.fn() }));

const key = 'sk-deepseek-valid-test-key';
const models = [
  { id: 'deepseek-flash', name: 'DeepSeek Flash', maxOutputTokens: 8192 },
  { id: 'deepseek-pro', name: 'DeepSeek Pro' },
];

let stored: Record<string, unknown>;
let save: ReturnType<typeof vi.fn>;

const makeHandler = (apiKeyInput = key) => {
  const deps = {
    apiKeyInput,
    setIsValidating: vi.fn(),
    setErrorMessage: vi.fn(),
    setCurrentStep: vi.fn(),
    persistStep: vi.fn().mockResolvedValue(undefined),
  };
  return { run: createHandleOnboardingKeySave(deps), ...deps };
};

beforeEach(() => {
  vi.clearAllMocks();
  stored = {};
  save = vi.fn().mockImplementation(async (values: Record<string, unknown>) => {
    Object.assign(stored, values);
  });
  vi.stubGlobal('chrome', { storage: { local: {
    get: vi.fn().mockImplementation(async () => ({ ...stored })),
    set: save,
  } } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(fetchModelsForProvider).mockResolvedValue(models);
  setSelectedServiceId('');
  setSelectedModelId('');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DeepSeek onboarding key validation', () => {
  it.each(['', 'short-key'])('does not submit or save an incomplete key: %j', async (input) => {
    const handler = makeHandler(input);
    await handler.run();
    expect(fetchModelsForProvider).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(handler.setCurrentStep).not.toHaveBeenCalled();
    expect(handler.setErrorMessage).toHaveBeenCalledWith(expect.any(String));
  });

  it('keeps an existing key untouched when validation fails', async () => {
    stored.deepseekApiKey = 'existing-working-key';
    vi.mocked(fetchModelsForProvider).mockRejectedValue(new Error('DeepSeek 401 Unauthorized'));
    const handler = makeHandler();
    await handler.run();
    expect(save).not.toHaveBeenCalled();
    expect(stored.deepseekApiKey).toBe('existing-working-key');
    expect(handler.setCurrentStep).not.toHaveBeenCalled();
    expect(handler.setErrorMessage).toHaveBeenLastCalledWith(expect.stringContaining("That key didn't work."));
    expect(handler.setIsValidating.mock.calls).toEqual([[true], [false]]);
  });

  it('does not save a key when the provider returns no usable models', async () => {
    vi.mocked(fetchModelsForProvider).mockResolvedValue([]);
    const handler = makeHandler();
    await handler.run();
    expect(save).not.toHaveBeenCalled();
    expect(handler.setCurrentStep).not.toHaveBeenCalled();
    expect(handler.setIsValidating).toHaveBeenLastCalledWith(false);
  });

  it('validates before atomically saving the trimmed key, cache and first model', async () => {
    const handler = makeHandler(`  ${key}  `);
    vi.mocked(fetchModelsForProvider).mockImplementation(async () => {
      expect(save).not.toHaveBeenCalled();
      return models;
    });
    await handler.run();
    expect(fetchModelsForProvider).toHaveBeenCalledWith('deepseek', key);
    expect(save).toHaveBeenCalledTimes(1);
    expect(stored).toMatchObject({
      deepseekApiKey: key,
      selectedService: 'deepseek',
      selectedModel: 'deepseek-flash',
      selectedModel_deepseek: 'deepseek-flash',
      cachedModels_deepseek: { models, fetchedAt: expect.any(Number) },
    });
    expect(getSelectedServiceId()).toBe('deepseek');
    expect(getSelectedModelId()).toBe('deepseek-flash');
    expect(handler.setCurrentStep).toHaveBeenCalledWith('success');
    expect(handler.persistStep).toHaveBeenCalledWith('success');
  });

  it.each([
    { selectedService: 'google', selectedModel: 'gemini-test', geminiApiKey: 'existing-key' },
    { selectedService: 'custom', selectedModel: 'local-model', customBaseUrl: 'http://localhost:11434/v1' },
  ])('preserves an existing configured $selectedService provider', async (settings) => {
    Object.assign(stored, settings);
    setSelectedServiceId(settings.selectedService);
    setSelectedModelId(settings.selectedModel);
    await makeHandler().run();
    expect(stored.selectedService).toBe(settings.selectedService);
    expect(stored.selectedModel).toBe(settings.selectedModel);
    expect(getSelectedServiceId()).toBe(settings.selectedService);
    expect(getSelectedModelId()).toBe(settings.selectedModel);
    expect(stored.deepseekApiKey).toBe(key);
    expect(save.mock.calls[0][0]).not.toHaveProperty('selectedService');
  });

  it('retains a previously selected DeepSeek model if it is still available', async () => {
    Object.assign(stored, {
      selectedService: 'deepseek', selectedModel: 'deepseek-pro', deepseekApiKey: 'existing-key',
    });
    await makeHandler().run();
    expect(stored.selectedModel).toBe('deepseek-pro');
    expect(getSelectedModelId()).toBe('deepseek-pro');
  });

  it('selects DeepSeek when an earlier provider selection has no credentials', async () => {
    Object.assign(stored, { selectedService: 'google', selectedModel: 'gemini-test' });
    await makeHandler().run();
    expect(stored.selectedService).toBe('deepseek');
    expect(stored.selectedModel).toBe('deepseek-flash');
  });

  it('ignores duplicate submissions while one validation is pending', async () => {
    let finish: (value: typeof models) => void = () => {};
    vi.mocked(fetchModelsForProvider).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const handler = makeHandler();
    const first = handler.run();
    await handler.run();
    expect(fetchModelsForProvider).toHaveBeenCalledTimes(1);
    finish(models);
    await first;
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does not show success when persisting the validated key fails', async () => {
    save.mockRejectedValue(new Error('Storage unavailable'));
    const handler = makeHandler();
    await handler.run();
    expect(handler.setCurrentStep).not.toHaveBeenCalled();
    expect(handler.setIsValidating).toHaveBeenLastCalledWith(false);
  });
});
