import { useI18n } from '../../../i18n';
import { useCallback } from 'react';
import { ExternalLinkIcon } from '../../icons/Icons';
import { type PartnerApp } from '../../../types/discover';
import './PartnerCard.css';

interface PartnerCardProps {
  partner: PartnerApp;
}

const PartnerCard = ({ partner }: PartnerCardProps) => {
  const { t } = useI18n();
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      chrome.tabs.create({ url: partner.url });
    },
    [partner.url]
  );

  return (
    <a
      href={partner.url}
      className="partner-card"
      onClick={handleClick}
      title={t('Visit {name}', { name: partner.title })}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="partner-card-logo">
        <img src={partner.logoPath} alt={t('{name} logo', { name: partner.title })} width={36} height={36} />
      </div>
      <div className="partner-card-content">
        <div className="partner-card-meta">
          <span className="partner-card-badge">{t("Friend")}</span>
          <ExternalLinkIcon width={10} height={10} />
        </div>
        <h3 className="partner-card-title">{partner.title}</h3>
        <p className="partner-card-description">{t(partner.description)}</p>
      </div>
    </a>
  );
};

export default PartnerCard;
