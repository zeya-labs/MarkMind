import { useState } from 'react';
import { type LanguagePreference, useI18n } from './index';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { t, preference, setLanguage } = useI18n();
  const [error, setError] = useState(false);
  return (
    <div className="language-selector">
      <select
        aria-label={t('Language')}
        title={t('Language')}
        value={preference}
        onChange={event => {
          setError(false);
          void setLanguage(event.target.value as LanguagePreference).catch(() => setError(true));
        }}
      >
        <option value="auto">{t('System language')}</option>
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </select>
      {error && <span role="alert">{t('Could not save language preference.')}</span>}
    </div>
  );
};

export default LanguageSelector;
