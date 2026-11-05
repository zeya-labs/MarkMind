import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguage } from '../../i18n';
import FolderTreeGroup from './FolderTreeGroup';

afterEach(async () => { await setLanguage('en'); });

describe('FolderTreeGroup controls', () => {
  it('keeps the selection action outside the expand button', () => {
    const markup = renderToStaticMarkup(createElement(FolderTreeGroup, {
      groupName: 'Research',
      itemCount: 2,
      headerAction: createElement('button', { type: 'button' }, 'Select group'),
      children: 'Bookmarks',
    }));

    expect(markup.match(/<button\b/g)).toHaveLength(2);
    expect(markup).not.toMatch(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/);
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain(' hidden=""');
  });

  it('localizes the expand hint without translating a user folder name', async () => {
    await setLanguage('zh-CN');
    const markup = renderToStaticMarkup(createElement(FolderTreeGroup, {
      groupName: 'Research',
      itemCount: 2,
      defaultExpanded: true,
      children: 'Bookmarks',
    }));

    expect(markup).toContain('收起“Research”');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('>Research</span>');
    expect(markup).not.toContain(' hidden=""');
  });
});
