import { LOADING_MESSAGE_TEMPLATES } from '../config/loadingMessages';
import { getLanguage, t } from '../i18n';

// Builds a status message from a template, substituting the real bookmark count
// so the user sees what is actually happening (no fake progress).

const formatBookmarkCount = (bookmarkCount: number): string => {
  const formatted = bookmarkCount.toLocaleString(getLanguage());
  return getLanguage() === 'zh-CN'
    ? t('{count} bookmarks', { count: formatted })
    : `${formatted} bookmark${bookmarkCount === 1 ? '' : 's'}`;
};

export const buildLoadingMessage = (index: number, bookmarkCount: number): string => {
  const template = LOADING_MESSAGE_TEMPLATES[index % LOADING_MESSAGE_TEMPLATES.length];
  return t(template, { bookmarks: formatBookmarkCount(bookmarkCount) });
};

export const getNextLoadingMessageIndex = (currentIndex: number): number => {
  return (currentIndex + 1) % LOADING_MESSAGE_TEMPLATES.length;
};
