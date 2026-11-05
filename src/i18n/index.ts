import { useSyncExternalStore } from 'react';
import core from './locales/zh-CN/core';
import organize from './locales/zh-CN/organize';
import messages from './locales/zh-CN/messages';

export type Language = 'en' | 'zh-CN';
export type LanguagePreference = 'auto' | Language;
export const LANGUAGE_STORAGE_KEY = 'interfaceLanguage';

const chinese: Record<string, string> = { ...core, ...organize, ...messages };
const listeners = new Set<() => void>();
let preference: LanguagePreference = 'auto';
let revision = 0;
let initialization: Promise<void> | undefined;

export const resolveLanguage = (value: unknown, browserLanguage: string): Language => {
  if (value === 'en' || value === 'zh-CN') return value;
  return /^zh(?:-|$)/i.test(browserLanguage) ? 'zh-CN' : 'en';
};

const browserLanguage = (): string => {
  if (typeof navigator !== 'undefined') return navigator.language;
  if (typeof chrome !== 'undefined' && chrome.i18n) return chrome.i18n.getUILanguage();
  return 'en';
};

export const getLanguage = (): Language => resolveLanguage(preference, browserLanguage());
export const getLanguagePreference = (): LanguagePreference => preference;

const normalizePreference = (value: unknown): LanguagePreference =>
  value === 'en' || value === 'zh-CN' ? value : 'auto';

const notify = (): void => {
  if (typeof document !== 'undefined') document.documentElement.lang = getLanguage();
  listeners.forEach(listener => listener());
};

export const interpolate = (text: string, values: Record<string, string | number> = {}): string =>
  text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);

/** English source strings are stable keys; missing translations fall back to English. */
export const t = (source: string, values?: Record<string, string | number>): string =>
  interpolate(getLanguage() === 'zh-CN' ? chinese[source] ?? source : source, values);

export const initI18n = (): Promise<void> => {
  if (initialization) return initialization;
  initialization = (async () => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      notify();
      return;
    }
    chrome.storage.onChanged?.addListener((changes, area) => {
      if (area !== 'local' || !changes[LANGUAGE_STORAGE_KEY]) return;
      revision += 1;
      preference = normalizePreference(changes[LANGUAGE_STORAGE_KEY].newValue);
      notify();
    });
    const version = revision;
    try {
      const saved = await chrome.storage.local.get(LANGUAGE_STORAGE_KEY);
      if (version === revision) preference = normalizePreference(saved[LANGUAGE_STORAGE_KEY]);
    } catch (error) {
      console.warn('Could not load language preference:', error);
    }
    notify();
  })();
  return initialization;
};

export const setLanguage = async (value: LanguagePreference): Promise<void> => {
  preference = normalizePreference(value);
  revision += 1;
  notify();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [LANGUAGE_STORAGE_KEY]: preference });
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const useI18n = () => {
  const preference = useSyncExternalStore(subscribe, getLanguagePreference, () => 'auto' as const);
  return { t, language: getLanguage(), preference, setLanguage };
};
