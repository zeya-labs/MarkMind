import { type ChromeBookmarkNode } from '../types/bookmarks';

export const isWritableFolder = (node: ChromeBookmarkNode): boolean =>
  !node.url && node.type !== 'separator' && !node.unmodifiable;

/** Root order and IDs differ: Firefox puts its menu before the toolbar. */
export const getDefaultBookmarkParent = (tree: ChromeBookmarkNode[]): string => {
  const roots = (tree[0]?.children ?? []).filter(isWritableFolder);
  const toolbar = roots.find(node =>
    node.folderType === 'bookmarks-bar' || node.id === 'toolbar_____' || node.id === '1'
  );
  return (toolbar ?? roots[0])?.id ?? '';
};
