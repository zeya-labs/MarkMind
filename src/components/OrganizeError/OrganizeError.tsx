import { WarningIcon, RefreshIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import Button from '../Button/Button';
import { useI18n } from '../../i18n';

interface OrganizeErrorProps {
  errorMessage: string | null;
  onReset: () => void;
}

const OrganizeError = ({ errorMessage, onReset }: OrganizeErrorProps) => {
  const { t } = useI18n();
  return (
  <OrganizeStatusView
    icon={<WarningIcon width={20} height={20} />}
    title={t('Something went wrong')}
    description={errorMessage ? t(errorMessage) : t('An unexpected error occurred')}
  >
    <Button onClick={onReset} fullWidth>
      <RefreshIcon />
      {t('Try Again')}
    </Button>
  </OrganizeStatusView>
  );
};

export default OrganizeError;
