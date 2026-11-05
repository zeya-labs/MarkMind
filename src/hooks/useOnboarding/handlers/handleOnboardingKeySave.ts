import {
  SERVICES,
  MODELS_CACHE_KEY_PREFIX,
  SELECTED_SERVICE_STORAGE_KEY,
  SELECTED_MODEL_STORAGE_KEY,
  getServiceCredentialKeys,
  isServiceConfigured,
} from '../../../config/services';
import { fetchModelsForProvider } from '../../../services/ai/providerUtils';
import { setSelectedServiceId, setSelectedModelId } from '../../../services/selectedState';
import { type HandleOnboardingKeySaveDeps } from '../types';

export const createHandleOnboardingKeySave = (deps: HandleOnboardingKeySaveDeps) => {
  let isSaving = false;

  return async (): Promise<void> => {
    if (isSaving) return;
    const { apiKeyInput, setIsValidating, setErrorMessage, setCurrentStep, persistStep } = deps;

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      setErrorMessage('Paste your key in the field above first.');
      return;
    }

    const deepseekService = SERVICES.deepseek;

    if (!deepseekService.validateKey(trimmedKey)) {
      setErrorMessage("That doesn't look like a complete DeepSeek API key. Copy the full key from the DeepSeek platform.");
      return;
    }

    isSaving = true;
    setIsValidating(true);
    setErrorMessage('');

    try {
      // A failed request must never replace a previously working key.
      const models = await fetchModelsForProvider('deepseek', trimmedKey);

      if (models.length === 0) {
        setErrorMessage('Something went wrong loading AI models. Try again in a moment.');
        return;
      }

      const stored = await chrome.storage.local.get([
        SELECTED_SERVICE_STORAGE_KEY,
        SELECTED_MODEL_STORAGE_KEY,
        'selectedModel_deepseek',
        ...Object.values(SERVICES).flatMap(getServiceCredentialKeys),
      ]);
      const selectedServiceId = stored[SELECTED_SERVICE_STORAGE_KEY] as string | undefined;
      const selectedService = selectedServiceId ? SERVICES[selectedServiceId] : undefined;
      // Reopening setup should not silently switch someone away from an
      // existing configured provider, including a keyless local endpoint.
      const shouldSelectDeepSeek = !selectedService || selectedService.id === 'deepseek'
        || !isServiceConfigured(selectedService, stored);
      const savedModelId = selectedServiceId === 'deepseek'
        ? stored[SELECTED_MODEL_STORAGE_KEY] || stored.selectedModel_deepseek
        : stored.selectedModel_deepseek;
      const selectedModel = models.find(model => model.id === savedModelId) || models[0];
      const cacheKey = `${MODELS_CACHE_KEY_PREFIX}deepseek`;

      await chrome.storage.local.set({
        [deepseekService.storageKey]: trimmedKey,
        [cacheKey]: { models, fetchedAt: Date.now() },
        selectedModel_deepseek: selectedModel.id,
        ...(shouldSelectDeepSeek && {
          [SELECTED_SERVICE_STORAGE_KEY]: 'deepseek',
          [SELECTED_MODEL_STORAGE_KEY]: selectedModel.id,
        }),
      });

      if (shouldSelectDeepSeek) {
        setSelectedServiceId('deepseek');
        setSelectedModelId(selectedModel.id, selectedModel.maxOutputTokens);
      }

      setCurrentStep('success');
      await persistStep('success');

    } catch (error) {
      console.error('Failed to validate onboarding API key:', error);
      const message = error instanceof Error ? error.message.toLowerCase() : '';

      const isAuthError = message.includes('401') || message.includes('403')
        || message.includes('invalid') || message.includes('api key')
        || message.includes('unauthorized') || message.includes('permission');

      if (isAuthError) {
        setErrorMessage("That key didn't work. Double-check you copied the full key from the DeepSeek platform.");
      } else if (message.includes('balance') || message.includes('402')) {
        setErrorMessage('DeepSeek balance is insufficient. Add credit in the DeepSeek platform and try again.');
      } else {
        setErrorMessage('Could not connect to DeepSeek. Check your connection and try again.');
      }
    } finally {
      isSaving = false;
      setIsValidating(false);
    }
  };
};
