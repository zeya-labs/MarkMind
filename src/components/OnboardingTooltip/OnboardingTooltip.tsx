import { useI18n } from '../../i18n';
import Button from '../Button/Button';
import { XIcon } from '../icons/Icons';
import './OnboardingTooltip.css';

interface OnboardingTooltipProps {
  content: string;
  onDismiss: () => void;
}

const OnboardingTooltip = ({ content, onDismiss }: OnboardingTooltipProps) => {
  const { t } = useI18n();
  return (
    <div className="onboarding-tooltip">
      <div className="onboarding-tooltip-content">
        <p className="onboarding-tooltip-text">{t(content)}</p>
        <Button
          variant="icon"
          className="onboarding-tooltip-dismiss"
          onClick={onDismiss}
          title={t("Dismiss")}
        >
          <XIcon width={12} height={12} />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingTooltip;
