import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLanguage, getLanguagePreference, initI18n, interpolate, resolveLanguage, setLanguage, t } from './index';

afterEach(async () => {
  await setLanguage('auto');
  vi.unstubAllGlobals();
});

describe('language resolution', () => {
  it('detects Chinese variants and falls back to English for other browser languages', () => {
    expect(resolveLanguage('auto', 'zh-TW')).toBe('zh-CN');
    expect(resolveLanguage('auto', 'zh-CN')).toBe('zh-CN');
    expect(resolveLanguage('auto', 'fr-FR')).toBe('en');
    expect(resolveLanguage('en', 'zh-CN')).toBe('en');
    expect(resolveLanguage('zh-CN', 'en-US')).toBe('zh-CN');
  });

  it('interpolates numbers and preserves placeholders without values', () => {
    expect(interpolate('{count} bookmarks in {folder}', { count: 0 })).toBe('0 bookmarks in {folder}');
  });

  it('translates immediately and keeps unknown source text intact', async () => {
    await setLanguage('zh-CN');
    expect(getLanguage()).toBe('zh-CN');
    expect(t('Settings')).toBe('设置');
    expect(t('An untranslated message')).toBe('An untranslated message');
    await setLanguage('en');
    expect(t('Settings')).toBe('Settings');
  });

  it('loads and persists the choice and follows changes from other extension pages', async () => {
    const listeners: Array<(changes: Record<string, { newValue: unknown }>, area: string) => void> = [];
    const save = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('chrome', { storage: {
      local: { get: vi.fn().mockResolvedValue({ interfaceLanguage: 'zh-CN' }), set: save },
      onChanged: { addListener: (listener: typeof listeners[number]) => listeners.push(listener) },
    } });
    await initI18n();
    expect(getLanguage()).toBe('zh-CN');
    await setLanguage('en');
    expect(save).toHaveBeenCalledWith({ interfaceLanguage: 'en' });
    listeners[0]({ interfaceLanguage: { newValue: 'zh-CN' } }, 'local');
    expect(getLanguagePreference()).toBe('zh-CN');
  });
});
