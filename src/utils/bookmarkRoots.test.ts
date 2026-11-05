import { describe, expect, it } from 'vitest';
import { type ChromeBookmarkNode } from '../types/bookmarks';
import { getDefaultBookmarkParent } from './bookmarkRoots';
import { buildFullIdToPathMapFromTree } from './folders';
import { flattenAllBookmarks } from './bookmarkScanner';
import { listDestinationFolders, scopeFolderDataToDestination } from './destination';

const firefoxTree: ChromeBookmarkNode[] = [{
  id: 'root________', title: '', type: 'folder', children: [
    { id: 'menu________', title: '书签菜单', type: 'folder', children: [] },
    { id: 'toolbar_____', title: '书签工具栏', type: 'folder', children: [
      { id: 'separator___', title: '', type: 'separator', url: 'data:' },
      { id: 'devFolder___', title: '开发/文档', type: 'folder', children: [
        { id: 'bookmark____', title: '', type: 'bookmark', url: 'https://example.org/', parentId: 'devFolder___' },
      ] },
    ] },
    { id: 'unfiled_____', title: '其他书签', type: 'folder', children: [] },
    { id: 'mobile______', title: '移动设备书签', type: 'folder', children: [] },
  ],
}];

describe('Firefox bookmark trees', () => {
  it('prefers the toolbar even when the menu is first, independent of localized titles', () => {
    expect(getDefaultBookmarkParent(firefoxTree)).toBe('toolbar_____');
  });

  it('preserves Chinese folder names, slash escaping and GUIDs; excludes separators', () => {
    const map = buildFullIdToPathMapFromTree(firefoxTree);
    expect(map.devFolder___).toBe('书签工具栏/开发\\/文档');
    expect(map).not.toHaveProperty('separator___');
    const folders = listDestinationFolders(firefoxTree);
    expect(folders.map(folder => folder.id)).not.toContain('separator___');
    expect(scopeFolderDataToDestination('toolbar_____', folders)).toMatchObject({
      defaultParentId: 'toolbar_____', pathToIdMap: { '开发\\/文档': 'devFolder___' },
    });
  });

  it('includes bookmarks without titles using their URL as a display fallback', () => {
    const map = buildFullIdToPathMapFromTree(firefoxTree);
    expect(flattenAllBookmarks(firefoxTree, map)).toEqual([{
      id: 'bookmark____', title: 'https://example.org/', url: 'https://example.org/',
      currentFolderPath: '书签工具栏/开发\\/文档', currentFolderId: 'devFolder___',
    }]);
  });

  it('keeps Chromium toolbar selection and never returns an unwritable synthetic root', () => {
    expect(getDefaultBookmarkParent([{ id: '0', title: '', children: [
      { id: '2', title: 'Other bookmarks' }, { id: '1', title: 'Bookmarks bar' },
    ] }])).toBe('1');
    expect(getDefaultBookmarkParent([{ id: '0', title: '', children: [] }])).toBe('');
  });
});
