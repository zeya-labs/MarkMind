import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAssignments } from './applyAssignments';
import { installFakeBookmarks } from '../test/fakeBookmarks';
import { buildFullIdToPathMapFromTree, getFolderDataForAI } from '../utils/folders';
import { buildFolderTree, flattenAllBookmarks } from '../utils/bookmarkScanner';
import { listDestinationFolders } from '../utils/destination';
import { createBookmark, createFolder, findBookmarkByUrl, getBookmarkById, getBookmarkTree, moveBookmark, removeBookmark } from './bookmarks';

afterEach(() => { vi.unstubAllGlobals(); });

describe('native Promise-based bookmark API', () => {
  it('reads, searches, creates, moves and removes with Promise-only browser APIs', async () => {
    const fake = installFakeBookmarks({ id: 'root________', title: '', children: [{
      id: 'toolbar_____', title: 'Toolbar', children: [],
    }] });
    expect((await getBookmarkTree())[0].id).toBe('root________');
    const folder = await createFolder('toolbar_____', 'Research');
    const bookmark = await createBookmark('toolbar_____', 'Example', 'https://example.org/');
    expect((await getBookmarkById(bookmark.id))?.title).toBe('Example');
    expect((await findBookmarkByUrl('https://example.org/'))?.id).toBe(bookmark.id);
    await moveBookmark(bookmark.id, folder.id);
    expect(fake.parentOf(bookmark.id)).toBe(folder.id);
    await removeBookmark(bookmark.id);
    expect(await findBookmarkByUrl('https://example.org/')).toBeNull();
    await expect(getBookmarkById(bookmark.id)).rejects.toThrow("Can't find bookmark");
    await expect(createFolder('missing', 'Nope')).rejects.toThrow("Can't find parent");
  });
});

describe('applying paths with slash-containing and untitled folders', () => {
  it('keeps a slash-containing folder distinct from a matching nested path in the selection tree', () => {
    const tree = buildFolderTree([
      { id: 'a', title: 'A', url: 'https://a.example/', currentFolderId: 'slash', currentFolderPath: 'Toolbar/开发\\/文档' },
      { id: 'b', title: 'B', url: 'https://b.example/', currentFolderId: 'nested', currentFolderPath: 'Toolbar/开发/文档' },
    ]);
    expect(tree.children[0]).toMatchObject({ name: '开发/文档', path: '开发\\/文档' });
    expect(tree.children[1].children[0]).toMatchObject({ name: '文档', path: '开发/文档' });
    expect(tree.children[0].bookmarks.map(bookmark => bookmark.id)).toEqual(['a']);
    expect(tree.children[1].children[0].bookmarks.map(bookmark => bookmark.id)).toEqual(['b']);
  });

  for (const path of ['书签工具栏/开发\\/文档/React', '书签工具栏/开发/文档/React']) {
    it(`creates a child inside the existing slash-containing folder: ${path}`, async () => {
      const fake = installFakeBookmarks({ id: 'root________', title: '', children: [{
        id: 'toolbar_____', title: '书签工具栏', children: [
          { id: 'slashFolder_', title: '开发/文档', children: [] },
          { id: 'bookmark____', title: 'React docs', url: 'https://react.dev/' },
        ],
      }] });
      const folderData = await getFolderDataForAI();
      const result = await applyAssignments({
        assignments: [{
          bookmarkId: 'bookmark____', bookmarkTitle: 'React docs', bookmarkUrl: 'https://react.dev/',
          currentPath: '书签工具栏', suggestedPath: path, suggestedFolderId: null,
          isNewFolder: true, isApproved: true,
        }],
        allowedBookmarkIds: new Set(['bookmark____']),
        pathToIdMap: folderData.pathToIdMap,
        defaultParentId: folderData.defaultParentId,
      });

      expect(result.appliedCount).toBe(1);
      const reactFolder = fake.findChildFolder('slashFolder_', 'React');
      expect(reactFolder).toBeDefined();
      expect(fake.parentOf('bookmark____')).toBe(reactFolder);
      expect(fake.childTitles('toolbar_____')).toEqual(['开发/文档']);
      expect(result.pathToIdMap['书签工具栏/开发\\/文档/React']).toBe(reactFolder);
    });
  }

  it('keeps unnamed folders addressable without renaming them or exposing the synthetic root', async () => {
    const fake = installFakeBookmarks({ id: 'root________', title: '', children: [{
      id: 'toolbar_____', title: '书签工具栏', children: [
        { id: 'untitledA___', title: '', children: [{ id: 'existing____', title: 'Existing', url: 'https://example.org/' }] },
        { id: 'untitledB___', title: '', children: [] },
        { id: 'bookmark____', title: 'React docs', url: 'https://react.dev/' },
      ],
    }] });
    const tree = fake.getTree();
    const paths = buildFullIdToPathMapFromTree(tree);
    expect(paths).not.toHaveProperty('root________');
    expect(paths.untitledA___).toBe('书签工具栏/◌ [untitledA___]');
    expect(paths.untitledB___).not.toBe(paths.untitledA___);
    expect(flattenAllBookmarks(tree, paths).find(bookmark => bookmark.id === 'existing____')?.currentFolderPath)
      .toBe(paths.untitledA___);
    expect(listDestinationFolders(tree).map(folder => folder.id)).toEqual(['toolbar_____', 'untitledA___', 'untitledB___']);
    const folderData = await getFolderDataForAI();
    const result = await applyAssignments({
      assignments: [{
        bookmarkId: 'bookmark____', bookmarkTitle: 'React docs', bookmarkUrl: 'https://react.dev/',
        currentPath: '书签工具栏', suggestedPath: `${paths.untitledA___}/React`, suggestedFolderId: null,
        isNewFolder: true, isApproved: true,
      }],
      allowedBookmarkIds: new Set(['bookmark____']),
      pathToIdMap: folderData.pathToIdMap,
      defaultParentId: folderData.defaultParentId,
    });

    expect(result.appliedCount).toBe(1);
    expect(fake.parentOf('bookmark____')).toBe(fake.findChildFolder('untitledA___', 'React'));
    expect(fake.childTitles('toolbar_____')).toEqual(['', '']);
  });
});
