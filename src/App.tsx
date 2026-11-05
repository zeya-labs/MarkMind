import { useState, useEffect, useCallback } from 'react';
import ApiKeyPanel from './components/ApiKeyPanel/ApiKeyPanel';
import MainContent from './components/MainContent/MainContent';
import Onboarding from './components/Onboarding/Onboarding';
import { SERVICES, SELECTED_SERVICE_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY, getServiceCredentialKeys, isServiceConfigured } from './config/services';
import { initSelectedState } from './services/selectedState';
import { useTheme } from './hooks/useTheme';
import {
  ONBOARDING_COMPLETE_STORAGE_KEY,
  ONBOARDING_TOOLTIPS_PENDING_KEY,
  ONBOARDING_TOOLTIPS_SEEN_KEY,
} from './config/onboarding';

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false);
  const [hasAnyApiKey, setHasAnyApiKey] = useState<boolean | null>(null);
  const [hasConfiguredProvider, setHasConfiguredProvider] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [showOnboardingTooltips, setShowOnboardingTooltips] = useState(false);

  const checkForExistingApiKeys = useCallback(async (): Promise<void> => {
    const services = Object.values(SERVICES);
    const storageKeys = services.flatMap(getServiceCredentialKeys);
    const result = await chrome.storage.local.get([
      ...storageKeys,
      SELECTED_SERVICE_STORAGE_KEY,
      SELECTED_MODEL_STORAGE_KEY,
      ONBOARDING_COMPLETE_STORAGE_KEY,
      ONBOARDING_TOOLTIPS_PENDING_KEY,
      ONBOARDING_TOOLTIPS_SEEN_KEY,
    ]);
    await initSelectedState();
    const hasKey = services.some((service) => isServiceConfigured(service, result));
    const selectedService = SERVICES[result[SELECTED_SERVICE_STORAGE_KEY]];
    setHasConfiguredProvider(!!selectedService && isServiceConfigured(selectedService, result)
      && !!result[SELECTED_MODEL_STORAGE_KEY]);

    setHasAnyApiKey(hasKey);
    setOnboardingComplete(!!result[ONBOARDING_COMPLETE_STORAGE_KEY]);

    const tooltipsPending = !!result[ONBOARDING_TOOLTIPS_PENDING_KEY];
    const tooltipsSeen = !!result[ONBOARDING_TOOLTIPS_SEEN_KEY];
    setShowOnboardingTooltips(hasKey && tooltipsPending && !tooltipsSeen);
  }, []);

  useEffect(() => {
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  useEffect(() => {
    // Settings may finish validating after the user returns to their bookmarks.
    // Keep the AI entry points ready without requiring another popup restart.
    // During onboarding, wait for its explicit completion to retain the success step.
    if (hasAnyApiKey === null || (!hasAnyApiKey && !onboardingComplete)) return;
    const keys = new Set([
      ...Object.values(SERVICES).flatMap(getServiceCredentialKeys),
      SELECTED_SERVICE_STORAGE_KEY,
      SELECTED_MODEL_STORAGE_KEY,
    ]);
    const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && Object.keys(changes).some(key => keys.has(key))) {
        void checkForExistingApiKeys();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [checkForExistingApiKeys, hasAnyApiKey, onboardingComplete]);

  const handleApiKeyPanelClose = useCallback((): void => {
    setShowApiKeyPanel(false);
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  const handleOpenSettings = useCallback((): void => {
    setShowApiKeyPanel(true);
  }, []);

  const handleOnboardingComplete = useCallback((): void => {
    setShowApiKeyPanel(false);
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  const handleEscapeToApiKeyPanel = useCallback((): void => {
    setOnboardingComplete(true);
    setShowApiKeyPanel(true);
  }, []);

  const handleTooltipsDismissed = useCallback(async (): Promise<void> => {
    setShowOnboardingTooltips(false);
    try {
      await chrome.storage.local.set({
        [ONBOARDING_TOOLTIPS_PENDING_KEY]: false,
        [ONBOARDING_TOOLTIPS_SEEN_KEY]: true,
      });
    } catch (error) {
      console.error('Failed to mark tooltips as seen:', error);
    }
  }, []);

  if (hasAnyApiKey === null || onboardingComplete === null) {
    return null;
  }

  const showOnboarding = !hasAnyApiKey && !onboardingComplete;

  return (
    <div className="container">
      {!showOnboarding && (
        <div hidden={showApiKeyPanel}>
          <MainContent
            onOpenSettings={handleOpenSettings}
            hasConfiguredProvider={hasConfiguredProvider}
            theme={theme}
            onToggleTheme={toggleTheme}
            showOnboardingTooltips={showOnboardingTooltips}
            onTooltipsDismissed={handleTooltipsDismissed}
          />
        </div>
      )}

      {showOnboarding && (
        <Onboarding
          isOpen
          onComplete={handleOnboardingComplete}
          onEscapeToApiKeyPanel={handleEscapeToApiKeyPanel}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {!showOnboarding && (
        <ApiKeyPanel
          isOpen={showApiKeyPanel}
          showWelcomeMessage={!hasAnyApiKey}
          canClose
          onClose={handleApiKeyPanelClose}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;
