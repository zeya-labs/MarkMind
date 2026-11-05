import { t } from '../../i18n';
import { useState, useEffect, useCallback, useRef } from 'react';
import { buildLoadingMessage, getNextLoadingMessageIndex } from '../../utils/loadingMessages';
import { type StatusType } from '../../types/common';
import { type FolderDataForAI, type PendingSuggestion } from '../../types/bookmarks';
import { type PageMetadata } from '../../types/pages';
import { getFolderDataForAI, findFolderPathById, findFolderIdByAIPath } from '../../utils/folders';
import { organizeBookmark } from '../../services/ai';
import { getSelectedServiceId, getSelectedModelId } from '../../services/selectedState';
import { getCurrentPageData } from '../../services/pageMetadata';
import { findBookmarkByUrl, createBookmark, moveBookmark, createFolderPath } from '../../services/bookmarks';
import { type UseOrganizeBookmarkReturn } from './types';

const LOADING_MESSAGE_INTERVAL_MS = 2000;
const STATUS_AUTO_CLEAR_MS = 5000;

export const useOrganizeBookmark = (): UseOrganizeBookmarkReturn => {
  const [currentPageData, setCurrentPageData] = useState<PageMetadata | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('default');
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);
  const [existingBookmarkPath, setExistingBookmarkPath] = useState<string | null>(null);
  const [existingBookmarkId, setExistingBookmarkId] = useState<string | null>(null);

  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMessageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const folderDataRef = useRef<FolderDataForAI | null>(null);
  const loadingMessageIndexRef = useRef(0);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        const pageData = await getCurrentPageData();
        if (pageData) {
          setCurrentPageData(pageData);

          const existingBookmark = await findBookmarkByUrl(pageData.url);
          if (existingBookmark) {
            setExistingBookmarkId(existingBookmark.id);
            const folderData = await getFolderDataForAI();
            const folderPath = existingBookmark.parentId
              ? findFolderPathById(folderData.idToPathMap, existingBookmark.parentId)
              : null;
            if (folderPath) {
              setExistingBookmarkPath(folderPath);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing organize bookmark:', error);
      } finally {
        setIsLoadingPage(false);
      }
    };

    initialize();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
      }
    };
  }, []);

  const clearLoadingMessages = useCallback((): void => {
    if (loadingMessageIntervalRef.current) {
      clearInterval(loadingMessageIntervalRef.current);
      loadingMessageIntervalRef.current = null;
    }
  }, []);

  const startLoadingMessages = useCallback((): void => {
    // Single-page organize handles exactly one bookmark.
    const SINGLE_BOOKMARK_COUNT = 1;

    loadingMessageIndexRef.current = 0;
    setStatusMessage(buildLoadingMessage(0, SINGLE_BOOKMARK_COUNT));
    setStatusType('loading');

    loadingMessageIntervalRef.current = setInterval(() => {
      loadingMessageIndexRef.current = getNextLoadingMessageIndex(loadingMessageIndexRef.current);
      setStatusMessage(buildLoadingMessage(loadingMessageIndexRef.current, SINGLE_BOOKMARK_COUNT));
    }, LOADING_MESSAGE_INTERVAL_MS);
  }, []);

  const showStatus = useCallback((message: string, type: StatusType = 'default'): void => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    clearLoadingMessages();
    setStatusMessage(message);
    setStatusType(type);

    if (type === 'success' || type === 'error') {
      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage('');
        setStatusType('default');
        statusTimeoutRef.current = null;
      }, STATUS_AUTO_CLEAR_MS);
    }
  }, [clearLoadingMessages]);

  const handleOrganizePage = useCallback(async (): Promise<void> => {
    if (isOrganizing || !currentPageData?.url) return;

    try {
      setIsOrganizing(true);
      setExistingBookmarkPath(null);
      setPendingSuggestion(null);
      startLoadingMessages();

      const folderData = await getFolderDataForAI();

      const serviceId = getSelectedServiceId();

      if (!serviceId) {
        showStatus(t('Please select an AI provider first'), 'error');
        return;
      }

      const selectedModel = getSelectedModelId();

      if (!selectedModel) {
        showStatus(t('Please select a model in Settings first'), 'error');
        return;
      }

      folderDataRef.current = folderData;

      const aiResponse = await organizeBookmark(serviceId, selectedModel, {
        title: currentPageData.title,
        url: currentPageData.url,
        description: currentPageData.description || null,
        h1: currentPageData.h1 || null,
        folderTree: folderData.textTree,
      });

      const folderId = findFolderIdByAIPath(aiResponse.folderPath, folderData.pathToIdMap);

      setPendingSuggestion({
        pageTitle: currentPageData.title,
        pageUrl: currentPageData.url,
        folderPath: aiResponse.folderPath,
        folderId: folderId || null,
        isNewFolder: aiResponse.isNewFolder,
      });

      if (folderId) {
        showStatus(t('Suggested: {path}', { path: aiResponse.folderPath }), 'default');
      } else if (aiResponse.isNewFolder) {
        showStatus(t('New folder: {path}', { path: aiResponse.folderPath }), 'default');
      } else {
        showStatus(t('Folder not found: {path}', { path: aiResponse.folderPath }), 'error');
      }
    } catch (error) {
      console.error('Error organizing page:', error);
      const errorMessage = error instanceof Error ? t(error.message) : t('Unknown error');
      showStatus(t('Error: {message}', { message: t(errorMessage) }), 'error');
    } finally {
      setIsOrganizing(false);
      clearLoadingMessages();
    }
  }, [isOrganizing, currentPageData, showStatus, startLoadingMessages, clearLoadingMessages]);

  const handleAcceptSuggestion = useCallback(async (): Promise<void> => {
    if (!pendingSuggestion || !folderDataRef.current) return;

    try {
      setIsOrganizing(true);
      let targetFolderId = pendingSuggestion.folderId;

      if (pendingSuggestion.isNewFolder && !targetFolderId) {
        showStatus(t('Creating folder: {path}', { path: pendingSuggestion.folderPath }), 'default');
        targetFolderId = await createFolderPath(
          pendingSuggestion.folderPath,
          folderDataRef.current.pathToIdMap,
          folderDataRef.current.defaultParentId
        );
      }

      if (!targetFolderId) {
        showStatus(t('Could not determine target folder'), 'error');
        return;
      }

      if (existingBookmarkId) {
        showStatus(t('Moving bookmark...'), 'default');
        await moveBookmark(existingBookmarkId, targetFolderId);
        setExistingBookmarkPath(pendingSuggestion.folderPath);
      } else {
        showStatus(t('Saving bookmark...'), 'default');
        await createBookmark(
          targetFolderId,
          pendingSuggestion.pageTitle,
          pendingSuggestion.pageUrl
        );
      }

      setPendingSuggestion(null);
      showStatus(existingBookmarkId ? t('Bookmark moved!') : t('Bookmark saved!'), 'success');
    } catch (error) {
      console.error('Error saving bookmark:', error);
      const errorMessage = error instanceof Error ? t(error.message) : t('Unknown error');
      showStatus(t('Error: {message}', { message: t(errorMessage) }), 'error');
    } finally {
      setIsOrganizing(false);
    }
  }, [pendingSuggestion, existingBookmarkId, showStatus]);

  const handleDeclineSuggestion = useCallback((): void => {
    setPendingSuggestion(null);
    showStatus(t('Suggestion declined'), 'default');
  }, [showStatus]);

  return {
    currentPageData,
    isLoadingPage,
    isOrganizing,
    statusMessage,
    statusType,
    pendingSuggestion,
    existingBookmarkPath,
    existingBookmarkId,
    handleOrganizePage,
    handleAcceptSuggestion,
    handleDeclineSuggestion,
  };
};
