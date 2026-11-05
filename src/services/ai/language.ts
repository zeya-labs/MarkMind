import { getLanguage } from '../../i18n';

// Translate generated prose and new names, never the user's existing data or
// the machine-readable protocol (JSON property names and the NEW: marker).
export const getOutputLanguageInstruction = (): string => {
  const language = getLanguage() === 'zh-CN' ? 'Simplified Chinese (简体中文)' : 'English';
  return `OUTPUT LANGUAGE: Write new folder names, folder descriptions, and the organization summary in ${language}. Preserve existing folder names, bookmark titles, URLs, IDs, and existing path segments EXACTLY as supplied. Never translate or rename an existing folder. Keep JSON property names and the NEW: prefix unchanged.`;
};
