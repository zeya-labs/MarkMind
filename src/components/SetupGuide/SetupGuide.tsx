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

interface SetupGuideProps {
  onClose: () => void;
  onOpenAIStudio: () => void;
}

const SetupGuide = ({ onClose, onOpenAIStudio }: SetupGuideProps) => {
  const { t } = useI18n();
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
          <p className="setup-guide-text">{t("MarkMind uses AI to sort your bookmarks into folders. Gemini offers a free tier with usage limits; availability and pricing depend on your provider.")}</p>
          <p className="setup-guide-text">{t("To connect, you need an API key from your AI provider. It lets MarkMind send requests directly to that service.")}</p>
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
              <h3 className="api-key-title">{t("How to get your API key")}</h3>
              <p className="api-key-subtitle">{t("Follow these 4 simple steps")}</p>
            </div>
          </div>

          <div className="step-list">
            <div className="step-list-row">
              <span className="step-list-number">1</span>
              <span className="step-list-text">{t("Open Google AI Studio")}{' '}
                <Button variant="ghost" compact onClick={onOpenAIStudio}>
                  <ExternalLinkIcon width={10} height={10} />{t("Open")}</Button>
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
              <span className="step-list-text">{t("Copy the key and paste it in Settings")}</span>
            </div>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>{t("Got it")}</Button>
      </div>
    </div>
  </div>
);
};

export default SetupGuide;
