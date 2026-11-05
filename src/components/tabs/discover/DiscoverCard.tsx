import { useI18n } from '../../../i18n';
import {
  SparklesIcon,
  SettingsIcon,
  GlobeIcon,
  LightbulbIcon,
} from '../../icons/Icons';
import { type DiscoverCard as DiscoverCardType } from '../../../types/discover';
import './DiscoverCard.css';

const CARD_ICONS: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  sparkles: SparklesIcon,
  settings: SettingsIcon,
  globe: GlobeIcon,
  lightbulb: LightbulbIcon,
};

interface DiscoverCardProps {
  card: DiscoverCardType;
}

const DiscoverCard = ({ card }: DiscoverCardProps) => {
  const { t } = useI18n();
  const CardIcon = CARD_ICONS[card.iconName];

  return (
    <div className="discover-card">
      <div className={`discover-card-icon discover-card-icon-${card.badgeType}`}>
        {CardIcon && <CardIcon width={16} height={16} />}
      </div>
      <div className="discover-card-content">
        <div className="discover-card-meta">
          <span className={`discover-card-badge discover-card-badge-${card.badgeType}`}>
            {t(card.badgeLabel)}
          </span>
          {card.date && <span className="discover-card-date">{t(card.date)}</span>}
        </div>
        <h3 className="discover-card-title">{t(card.title)}</h3>
        <p className="discover-card-description">{t(card.description)}</p>
      </div>
    </div>
  );
};

export default DiscoverCard;
