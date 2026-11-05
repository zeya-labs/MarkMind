import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { setLanguage } from '../i18n';
import { buildLoadingMessage, getNextLoadingMessageIndex } from './loadingMessages';
import { LOADING_MESSAGE_TEMPLATES } from '../config/loadingMessages';

const countTemplateIndex = LOADING_MESSAGE_TEMPLATES.findIndex(template =>
  template.includes('{bookmarks}')
);

beforeEach(async () => { await setLanguage('en'); });
afterEach(async () => { await setLanguage('en'); });

describe('buildLoadingMessage', () => {
  it('substitutes a formatted, pluralized bookmark count', () => {
    const message = buildLoadingMessage(countTemplateIndex, 1240);
    expect(message).toContain('1,240 bookmarks');
    expect(message).not.toContain('{bookmarks}');
  });

  it('uses the singular form for one bookmark', () => {
    const message = buildLoadingMessage(countTemplateIndex, 1);
    expect(message).toContain('1 bookmark');
    expect(message).not.toContain('1 bookmarks');
  });

  it('wraps an out-of-range index instead of throwing', () => {
    expect(() => buildLoadingMessage(999, 5)).not.toThrow();
  });

  it('localizes the real count and all rotating messages in Chinese', async () => {
    await setLanguage('zh-CN');
    expect(buildLoadingMessage(countTemplateIndex, 1240)).toContain('1,240 条书签');
    for (let index = 0; index < LOADING_MESSAGE_TEMPLATES.length; index += 1) {
      const message = buildLoadingMessage(index, 1);
      expect(message).not.toContain('{bookmarks}');
      expect(message).not.toContain('1 bookmark');
      expect(message).not.toBe(LOADING_MESSAGE_TEMPLATES[index]);
    }
  });
});

describe('getNextLoadingMessageIndex', () => {
  it('wraps back to zero at the end', () => {
    expect(getNextLoadingMessageIndex(LOADING_MESSAGE_TEMPLATES.length - 1)).toBe(0);
  });

  it('advances by one otherwise', () => {
    expect(getNextLoadingMessageIndex(0)).toBe(1);
  });
});
