import { type ChromeBookmarkNode } from '../types/bookmarks';

export const escapeFolderSegment = (name: string): string => name.replace(/\//g, '\\/');

export const splitFolderPath = (path: string): string[] =>
  path.split(/(?<!\\)\//).map(segment => segment.replace(/\\\//g, '/'));

// Empty folder titles are valid. A stable, language-neutral placeholder keeps
// unnamed siblings distinct in the AI path map without renaming either one.
export const getFolderPathName = (node: ChromeBookmarkNode): string =>
  node.title || `◌ [${node.id}]`;
