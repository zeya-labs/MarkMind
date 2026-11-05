import { useI18n } from '../../i18n';
import LanguageSelector from '../../i18n/LanguageSelector';
import Button from '../Button/Button';
import {
  ArrowLeftIcon,
  KeyIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from '../icons/Icons';
import './SetupGuide.css';
import { type ServiceConfig } from '../../config/services';

interface SetupGuideProps {
  onClose: () => void;
  onOpenProvider: () => void;
  provider: ServiceConfig;
}

const SetupGuide = ({ onClose, onOpenProvider, provider }: SetupGuideProps) => {
  const { t } = useI18n();
  const isCustom = !!provider.baseUrlStorageKey;
  const steps = isCustom ? [
    'Start your OpenAI-compatible server',
    'Enter its base URL in Settings',
    'Add an API key if your server requires one',
    'Save the connection and select a model',
  ] : [
    'Open your provider’s API key page',
    'Create an account or sign in',
    'Create an API key',
    'Paste the key in Settings, save it, and select a model',
  ];
  return (
  <div className="api-key-panel active">
    <div className="api-key-panel-content">
      <header className="api-key-panel-header">
        <div className="header-settings">
          <div className="header-left">
            <Button variant="icon" onClick={onClose} title={t("Back to Settings")}>
              <ArrowLeftIcon />
            </Button>
            <h2 className="header-title">{t("Setup Guide")}</h2>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="api-key-panel-body">
        <div className="setup-guide-section">
          <h3 className="setup-guide-heading">{t("How does it work?")}</h3>
          <p className="setup-guide-text">{t('Choose an AI provider to organize bookmarks. DeepSeek is selected by default, and you can switch providers in Settings.')}</p>
          <p className="setup-guide-text">{t(isCustom
            ? 'For a local or custom server, enter the base URL and an API key only if required.'
            : 'To connect, you need an API key from your AI provider. It lets MarkMind send requests directly to that service.')}</p>
          <p className="setup-guide-text">{t('You can configure AI later in Settings.')}</p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <div className="info-card-icon-wrap">
              <CheckCircleIcon width={16} height={16} />
            </div>
            <div className="info-card-titles">
              <h3 className="info-card-title">{t("Good to know")}</h3>
            </div>
          </div>
          <div className="setup-guide-reassurances">
            <p className="setup-guide-reassurance-item">{t("The extension is free; AI usage depends on your provider.")}</p>
            <p className="setup-guide-reassurance-item">{t("Bookmark metadata is sent to your selected AI provider.")}</p>
            <p className="setup-guide-reassurance-item">{t("Set up your preferred provider in a few steps.")}</p>
          </div>
        </div>

        <div className="api-key-card">
          <div className="api-key-card-header">
            <div className="api-key-icon">
              <KeyIcon />
            </div>
            <div className="api-key-titles">
              <h3 className="api-key-title">{t(isCustom ? 'Connect a local or custom provider' : 'How to get your API key')}</h3>
              <p className="api-key-subtitle">{t("Follow these 4 simple steps")}</p>
            </div>
          </div>

          <div className="step-list">
            {steps.map((step, index) => (
              <div className="step-list-row" key={step}>
                <span className="step-list-number">{index + 1}</span>
                <span className="step-list-text">
                  {t(step)}
                  {index === 0 && provider.helpLink && (
                    <Button variant="ghost" compact onClick={onOpenProvider}>
                      <ExternalLinkIcon width={10} height={10} />
                      {t('Open {provider}', { provider: provider.name })}
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>{t("Got it")}</Button>
      </div>
    </div>
  </div>
);
};

export default SetupGuide;
