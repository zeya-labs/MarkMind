import { type OrganizeSession } from '../../types/organize';
import { CheckIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import Button from '../Button/Button';
import './OrganizeComplete.css';
import { useI18n } from '../../i18n';

interface OrganizeCompleteProps {
  session: OrganizeSession;
  onReset: () => void;
}

const OrganizeComplete = ({ session, onReset }: OrganizeCompleteProps) => {
  const { t } = useI18n();
  return (
    <OrganizeStatusView
      icon={
        <span className="organize-complete-icon">
          <CheckIcon width={20} height={20} />
        </span>
      }
      title={t('All tidy! Your bookmarks are organized.')}
    >
      <div className="organize-complete-stats">
        <div className="organize-complete-stat">
          <span className="organize-complete-stat-value">{session.appliedCount}</span>
          <span className="organize-complete-stat-label">{t('moved')}</span>
        </div>
        {session.skippedCount > 0 && (
          <div className="organize-complete-stat">
            <span className="organize-complete-stat-value">{session.skippedCount}</span>
            <span className="organize-complete-stat-label">{t('skipped')}</span>
          </div>
        )}
      </div>

      <Button variant="primary" onClick={onReset} fullWidth>
        {t('Done')}
      </Button>
    </OrganizeStatusView>
  );
};

export default OrganizeComplete;
