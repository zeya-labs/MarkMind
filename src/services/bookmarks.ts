import { type ChromeBookmarkNode, type FolderPathMap } from '../types/bookmarks';
import { escapeFolderSegment, splitFolderPath } from '../utils/folderPath';

export const getBookmarkTree = async (): Promise<ChromeBookmarkNode[]> => {
  return await chrome.bookmarks.getTree() as ChromeBookmarkNode[];
};

export const getBookmarkById = async (id: string): Promise<ChromeBookmarkNode | null> => {
  const results = await chrome.bookmarks.get(id);
  return results.length > 0 ? results[0] as ChromeBookmarkNode : null;
};

export const findBookmarkByUrl = async (url: string): Promise<ChromeBookmarkNode | null> => {
  const results = await chrome.bookmarks.search({ url });
  return results.length > 0 ? results[0] as ChromeBookmarkNode : null;
};

export const createFolder = async (
  parentId: string,
  title: string
): Promise<ChromeBookmarkNode> => {
  return await chrome.bookmarks.create({ parentId, title }) as ChromeBookmarkNode;
};

export const createBookmark = async (
  parentId: string,
  title: string,
  url: string
): Promise<ChromeBookmarkNode> => {
  return await chrome.bookmarks.create({ parentId, title, url }) as ChromeBookmarkNode;
};

export const moveBookmark = async (
  bookmarkId: string,
  destinationFolderId: string
): Promise<ChromeBookmarkNode> => {
  return await chrome.bookmarks.move(bookmarkId, { parentId: destinationFolderId }) as ChromeBookmarkNode;
};

export const removeBookmark = async (bookmarkId: string): Promise<void> => {
  await chrome.bookmarks.remove(bookmarkId);
};

export const createFolderPath = async (
  folderPath: string,
  pathToIdMap: FolderPathMap,
  defaultParentId: string
): Promise<string> => {
  // Blank segments ("", "A//B") would create untitled folders — an empty path
  // resolves to defaultParentId itself.
  let currentParentId = defaultParentId;
  let resolvedPath = '';
  let remainingPath = folderPath;

  // The AI may return existing names with literal slashes rather than their
  // escaped path-map representation. Reuse an unambiguous longest known prefix
  // before creating descendants; never reinterpret an ambiguous name.
  const prefixes = Object.entries(pathToIdMap).flatMap(([path, id]) => {
    const candidates = new Set([path, splitFolderPath(path).join('/')]);
    return [...candidates]
      .filter(candidate => folderPath === candidate || folderPath.startsWith(`${candidate}/`))
      .map(candidate => ({ path, id, length: candidate.length }));
  }).sort((a, b) => b.length - a.length);
  const longest = prefixes.filter(prefix => prefix.length === prefixes[0]?.length);
  if (longest.length > 0 && new Set(longest.map(prefix => prefix.id)).size === 1) {
    const prefix = longest[0];
    currentParentId = prefix.id;
    resolvedPath = prefix.path;
    remainingPath = folderPath.slice(prefix.length).replace(/^\//, '');
  }

  const segments = splitFolderPath(remainingPath).filter(segment => segment.trim() !== '');

  for (const segment of segments) {
    const escapedSegment = escapeFolderSegment(segment);
    resolvedPath = resolvedPath ? `${resolvedPath}/${escapedSegment}` : escapedSegment;

    if (pathToIdMap[resolvedPath]) {
      currentParentId = pathToIdMap[resolvedPath];
      continue;
    }

    // AI sometimes omits root segments (e.g. "Utilities" instead of "Bookmarks Bar/Utilities")
    // Only resolve when the match is unambiguous — avoids misfiling when multiple folders share a name
    const suffixMatches = Object.entries(pathToIdMap).filter(
      ([key]) => key.endsWith(`/${resolvedPath}`)
    );

    if (suffixMatches.length === 1) {
      currentParentId = suffixMatches[0][1];
      resolvedPath = suffixMatches[0][0];
      continue;
    }

    const newFolder = await createFolder(currentParentId, segment);
    currentParentId = newFolder.id;
    pathToIdMap[resolvedPath] = newFolder.id;
  }

  return currentParentId;
};
