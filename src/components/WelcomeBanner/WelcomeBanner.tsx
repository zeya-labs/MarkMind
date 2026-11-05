import { useI18n } from '../../i18n';
import { useState, useEffect, useCallback } from 'react';
import Button from '../Button/Button';
import { XIcon } from '../icons/Icons';
import './WelcomeBanner.css';

const STORAGE_KEY_WELCOME_BANNER = 'hasSeenWelcomeBanner';

const WelcomeBanner = () => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkBannerStatus = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY_WELCOME_BANNER);
        if (!result[STORAGE_KEY_WELCOME_BANNER]) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to check welcome banner status:', error);
      }
    };

    checkBannerStatus();
  }, []);

  const handleDismiss = useCallback(async (): Promise<void> => {
    setIsVisible(false);
    try {
      await chrome.storage.local.set({ [STORAGE_KEY_WELCOME_BANNER]: true });
    } catch (error) {
      console.error('Failed to save welcome banner dismissal:', error);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="welcome-banner">
      <div className="welcome-banner-content">
        <p className="welcome-banner-title">{t("Welcome to MarkMind!")}</p>
        <p className="welcome-banner-text">{t("Open Organize and let AI tidy up your bookmarks.")}</p>
      </div>
      <Button
        variant="icon"
        className="welcome-banner-dismiss"
        onClick={handleDismiss}
        title={t("Dismiss")}
      >
        <XIcon width={12} height={12} />
      </Button>
    </div>
  );
};

export default WelcomeBanner;
