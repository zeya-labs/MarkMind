import {
  ONBOARDING_COMPLETE_STORAGE_KEY,
  ONBOARDING_TOOLTIPS_PENDING_KEY,
} from '../../../config/onboarding';
import { type HandleOnboardingSkipDeps } from '../types';

export const createHandleOnboardingSkip = ({ onComplete, setErrorMessage }: HandleOnboardingSkipDeps) => {
  return async (): Promise<void> => {
    setErrorMessage('');
    try {
      await chrome.storage.local.set({
        [ONBOARDING_COMPLETE_STORAGE_KEY]: true,
        [ONBOARDING_TOOLTIPS_PENDING_KEY]: false,
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save skipped onboarding:', error);
      setErrorMessage('Could not save setup progress. Please try again.');
    }
  };
};
