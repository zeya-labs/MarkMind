import { afterEach, describe, expect, it } from 'vitest';
import { setLanguage } from '../../i18n';
import { getOutputLanguageInstruction } from './language';
import { buildUserPrompt } from './prompt';
import { buildBulkOrganizeUserPrompt } from './bulkPrompt';

afterEach(async () => { await setLanguage('en'); });

describe('AI output language', () => {
  it('uses the selected language for new names without translating existing bookmark data', async () => {
    await setLanguage('zh-CN');
    const prompt = buildBulkOrganizeUserPrompt([
      { id: 'fx-bookmark-1', title: 'React 入门', url: 'https://react.dev/?lang=zh', currentFolderPath: 'Work/参考', currentFolderId: 'folder-1' },
    ], 'Work/参考', [{ path: 'Work/参考', description: 'Existing notes' }], '我的收藏');

    expect(prompt).toContain('Simplified Chinese (简体中文)');
    expect(prompt).toContain('React 入门');
    expect(prompt).toContain('https://react.dev/?lang=zh');
    expect(prompt).toContain('Work/参考');
    expect(prompt).toContain('"我的收藏"');
    expect(prompt).toContain('Preserve existing folder names, bookmark titles, URLs, IDs, and existing path segments EXACTLY as supplied');
    expect(prompt).toContain('Keep JSON property names and the NEW: prefix unchanged');
  });

  it('also applies the selected language to single-page recommendations', async () => {
    await setLanguage('zh-CN');
    const prompt = buildUserPrompt({ title: '中文标题', url: 'https://example.com/', description: null, h1: null, folderTree: 'Existing/资料' });
    expect(prompt).toContain('Simplified Chinese');
    expect(prompt).toContain('Existing/资料');
    expect(prompt).toContain('中文标题');
  });

  it('switches back to English without retaining a previous Chinese instruction', async () => {
    await setLanguage('zh-CN');
    expect(getOutputLanguageInstruction()).toContain('Simplified Chinese');
    await setLanguage('en');
    const instruction = getOutputLanguageInstruction();
    expect(instruction).toContain('in English.');
    expect(instruction).not.toContain('Simplified Chinese');
  });
});
