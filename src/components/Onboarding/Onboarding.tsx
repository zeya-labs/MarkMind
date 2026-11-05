import { useI18n } from '../../i18n';
import LanguageSelector from '../../i18n/LanguageSelector';
import Button from '../Button/Button';
import {
  SparklesIcon,
  ShieldIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  KeyIcon,
  ExternalLinkIcon,
  SpinnerIcon,
  SunIcon,
  MoonIcon,
} from '../icons/Icons';
import { useOnboarding } from '../../hooks/useOnboarding';
import { type ResolvedTheme } from '../../hooks/useTheme';
import { type OnboardingStep } from '../../types/onboarding';
import { ONBOARDING_STEPS } from '../../config/onboarding';
import './Onboarding.css';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onEscapeToApiKeyPanel: () => void;
  theme: ResolvedTheme;
  onToggleTheme: () => void;
  startAtStep?: OnboardingStep;
}

const Onboarding = ({
  isOpen,
  onComplete,
  onEscapeToApiKeyPanel,
  theme,
  onToggleTheme,
  startAtStep,
}: OnboardingProps) => {
  const { t } = useI18n();
  const {
    currentStep,
    stepIndex,
    apiKeyInput,
    isValidating,
    errorMessage,
    handleNext,
    handleBack,
    handleApiKeyInputChange,
    handleApiKeyInputKeyDown,
    handleApiKeySubmit,
    handleOpenAIStudio,
    handleEscape,
  } = useOnboarding({ onComplete, onEscapeToApiKeyPanel, startAtStep });

  if (!isOpen) return null;

  const renderProgressDots = () => (
    <div className="onboarding-progress">
      {ONBOARDING_STEPS.map((step, index) => (
        <div
          key={step}
          className={`onboarding-dot${index <= stepIndex ? ' active' : ''}`}
        />
      ))}
    </div>
  );

  const renderBackButton = () => (
    <div className="onboarding-back-row">
      <Button variant="icon" onClick={handleBack} title={t("Go back")}>
        <ArrowLeftIcon />
      </Button>
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="onboarding-welcome">
      <img
        src="/assets/icons/icon48.png"
        alt="MarkMind"
        className="onboarding-welcome-logo"
      />
      <h1 className="onboarding-welcome-title">{t("Welcome to MarkMind")}</h1>
      <p className="onboarding-welcome-subtitle">{t("Your bookmarks are about to get organized with AI.")}</p>
      <div className="onboarding-features">
        <div className="onboarding-feature-item">
          <SparklesIcon width={16} height={16} />
          <span>{t("Smart folders, zero effort")}</span>
        </div>
        <div className="onboarding-feature-item">
          <ShieldIcon width={16} height={16} />
          <span>{t("Your API key stays on your device")}</span>
        </div>
        <div className="onboarding-feature-item">
          <CheckCircleIcon width={16} height={16} />
          <span>{t("Free extension, your choice of AI")}</span>
        </div>
      </div>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>{t("Let's get started")}</Button>
      </div>
    </div>
  );

  const renderExplainStep = () => (
    <div className="onboarding-step">
      {renderBackButton()}
      <h2 className="onboarding-explain-title">{t("How does it work?")}</h2>
      <p className="onboarding-explain-text">{t("MarkMind uses AI to sort your bookmarks into folders. Gemini offers a free tier with usage limits; availability and pricing depend on your provider.")}</p>
      <p className="onboarding-explain-text">{t("To connect, you need an API key from your AI provider. It lets MarkMind send requests directly to that service.")}</p>
      <div className="onboarding-reassurances">
        <div className="onboarding-reassurance-item">
          <CheckCircleIcon width={16} height={16} />
          <span>{t("The extension is free; AI usage depends on your provider.")}</span>
        </div>
        <div className="onboarding-reassurance-item">
          <ShieldIcon width={16} height={16} />
          <span>{t("Bookmark metadata is sent to your selected AI provider.")}</span>
        </div>
        <div className="onboarding-reassurance-item">
          <KeyIcon width={16} height={16} />
          <span>{t("Set up your preferred provider in a few steps.")}</span>
        </div>
      </div>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>{t("Show me how")}</Button>
      </div>
      <Button
        variant="unstyled"
        className="onboarding-escape-link"
        onClick={handleEscape}
      >{t("Already have an API key from another provider?")}</Button>
    </div>
  );

  const renderGuideStep = () => (
    <div className="onboarding-step">
      {renderBackButton()}
      <h2 className="onboarding-guide-title">{t("Let's grab your API key")}</h2>
      <p className="onboarding-guide-subtitle">{t("Follow these 4 simple steps:")}</p>
      <div className="step-list">
        <div className="step-list-row">
          <span className="step-list-number">1</span>
          <span className="step-list-text">{t("Open Google AI Studio")}<span className="onboarding-step-link">
              {' '}
              <Button variant="ghost" compact onClick={handleOpenAIStudio}>
                <ExternalLinkIcon width={10} height={10} />{t("Open")}</Button>
            </span>
          </span>
        </div>
        <div className="step-list-row">
          <span className="step-list-number">2</span>
          <span className="step-list-text">{t("Sign in with your Google account")}</span>
        </div>
        <div className="step-list-row">
          <span className="step-list-number">3</span>
          <span className="step-list-text">{t("Click \"Create API Key\"")}</span>
        </div>
        <div className="step-list-row">
          <span className="step-list-number">4</span>
          <span className="step-list-text">{t("Copy the key and paste it below")}</span>
        </div>
      </div>
      <div className="onboarding-input-section">
        <input
          type="password"
          aria-label={t('API Key')}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'onboarding-key-error' : undefined}
          placeholder={t("Paste your key here")}
          value={apiKeyInput}
          onChange={handleApiKeyInputChange}
          onKeyDown={handleApiKeyInputKeyDown}
          disabled={isValidating}
        />
        {errorMessage && (
          <p id="onboarding-key-error" role="alert" className="onboarding-error-message">{t(errorMessage)}</p>
        )}
        {isValidating && (
          <p className="onboarding-validating-text">
            <SpinnerIcon width={12} height={12} />{t("Connecting...")}</p>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={handleApiKeySubmit}
          disabled={isValidating}
        >
          {isValidating ? t("Connecting...") : t("Connect to Google AI")}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="onboarding-success">
      <CheckCircleIcon width={48} height={48} className="onboarding-success-icon" />
      <h2 className="onboarding-success-title">{t("You're all set!")}</h2>
      <p className="onboarding-success-subtitle">{t("MarkMind is connected and ready to organize your bookmarks.")}</p>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>{t("Start organizing")}</Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'explain':
        return renderExplainStep();
      case 'guide':
        return renderGuideStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="api-key-panel active">
      <div className="api-key-panel-content">
        <header className="api-key-panel-header">
          <div className="header-welcome">
            <div className="header-left">
              <img
                src="/assets/icons/icon48.png"
                alt="MarkMind"
                className="header-logo"
              />
              <h1 className="header-title">MarkMind</h1>
            </div>
            <div className="header-right">
              <LanguageSelector />
              <Button
                variant="icon"
                onClick={onToggleTheme}
                title={theme === 'dark' ? t("Switch to light mode") : t("Switch to dark mode")}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </div>
        </header>
        <div className="api-key-panel-body">
          {renderProgressDots()}
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
