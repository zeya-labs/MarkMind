import { useI18n } from '../../i18n';
import { useOrganizeBookmark } from '../../hooks/useOrganizeBookmark';
import WelcomeBanner from '../WelcomeBanner/WelcomeBanner';
import CurrentPageCard from '../CurrentPageCard/CurrentPageCard';
import QuickActions from '../QuickActions/QuickActions';
import OnboardingTooltip from '../OnboardingTooltip/OnboardingTooltip';
import Button from '../Button/Button';
import './HomeTab.css';

interface HomeTabProps {
  onTabChange: (tabId: string) => void;
  onOpenSettings: () => void;
  hasConfiguredProvider: boolean;
  showCardTooltip?: boolean;
  onDismissCardTooltip?: () => void;
}

const HomeTab = ({
  onTabChange,
  onOpenSettings,
  hasConfiguredProvider,
  showCardTooltip = false,
  onDismissCardTooltip,
}: HomeTabProps) => {
  const { t } = useI18n();
  const {
    currentPageData,
    isLoadingPage,
    isOrganizing,
    statusMessage,
    statusType,
    pendingSuggestion,
    existingBookmarkPath,
    existingBookmarkId,
    handleOrganizePage,
    handleAcceptSuggestion,
    handleDeclineSuggestion,
  } = useOrganizeBookmark();

  return (
    <>
      <WelcomeBanner />
      {!hasConfiguredProvider && (
        <section className="home-ai-setup" aria-labelledby="home-ai-setup-title">
          <h2 id="home-ai-setup-title">{t('AI is not configured yet')}</h2>
          <p>{t('You can browse bookmarks and remove duplicates now. Connect an AI provider whenever you want automatic organization.')}</p>
          <div className="home-ai-setup-actions">
            <Button onClick={onOpenSettings}>{t('Configure AI')}</Button>
            <Button onClick={() => onTabChange('organize')}>{t('Browse bookmarks')}</Button>
          </div>
        </section>
      )}
      <CurrentPageCard
        currentPage={currentPageData}
        isLoadingPage={isLoadingPage}
        isOrganizing={isOrganizing}
        statusMessage={statusMessage}
        statusType={statusType}
        pendingSuggestion={pendingSuggestion}
        existingBookmarkPath={existingBookmarkPath}
        existingBookmarkId={existingBookmarkId}
        onOrganize={hasConfiguredProvider ? handleOrganizePage : onOpenSettings}
        organizeLabel={hasConfiguredProvider ? undefined : t('Configure AI')}
        onAccept={handleAcceptSuggestion}
        onDecline={handleDeclineSuggestion}
      />
      {hasConfiguredProvider && showCardTooltip && onDismissCardTooltip && (
        <OnboardingTooltip
          content={t("This shows the page you're on. Hit Organize to find the perfect folder!")}
          onDismiss={onDismissCardTooltip}
        />
      )}
      <QuickActions onTabChange={onTabChange} onOpenSettings={onOpenSettings} />
    </>
  );
};

export default HomeTab;
