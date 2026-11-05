import { useState, useCallback, useMemo } from 'react';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../types/bookmarks';
import { buildFolderTree } from '../../utils/bookmarkScanner';
import { findDuplicateBookmarks, countRemovableDuplicates } from '../../utils/duplicates';
import { formatDestinationLabel } from '../../utils/destination';
import { FolderIcon, SpinnerIcon, RefreshIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import OrganizeDuplicates from '../OrganizeDuplicates/OrganizeDuplicates';
import TreeNode from '../TreeNode/TreeNode';
import Button from '../Button/Button';
import Dropdown from '../Dropdown/Dropdown';
import './OrganizeScan.css';
import { useI18n } from '../../i18n';

const NO_DESTINATION_ID = '';

interface OrganizeScanProps {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  onStartScan: () => void;
  onToggleBookmarks: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectDestination: (folderId: string) => void;
  onStartPlanning: () => void;
  onRemoveDuplicates: (bookmarkIdsToRemove: string[]) => Promise<void>;
}

const OrganizeScan = ({
  session,
  bookmarkStats,
  onStartScan,
  onToggleBookmarks,
  onSelectAll,
  onDeselectAll,
  onSelectDestination,
  onStartPlanning,
  onRemoveDuplicates,
}: OrganizeScanProps) => {
  const { t, language } = useI18n();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);

  const handleToggleExpand = useCallback((nodePath: string) => {
    setExpandedPaths(previous => {
      const next = new Set(previous);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  }, []);

  const folderTree = useMemo(
    () => buildFolderTree(session.allBookmarks),
    [session.allBookmarks]
  );

  const selectedSet = useMemo(
    () => new Set(session.selectedBookmarkIds ?? []),
    [session.selectedBookmarkIds]
  );

  const selectedCount = selectedSet.size;

  const destinationOptions = [
    { id: NO_DESTINATION_ID, label: t('Any folder (default)') },
    ...(session.destinationFolders ?? []).map(folder => ({
      id: folder.id,
      label: formatDestinationLabel(folder.path),
    })),
  ];
  const destinationLabel = destinationOptions.find(
    option => option.id !== NO_DESTINATION_ID && option.id === session.destinationFolderId
  )?.label;

  const duplicateGroups = useMemo(
    () => findDuplicateBookmarks(session.allBookmarks),
    [session.allBookmarks]
  );
  const duplicateCount = countRemovableDuplicates(duplicateGroups);

  // Many bookmarks means several passes — set expectations up front, in plain terms.
  const LARGE_SELECTION_THRESHOLD = 200;
  const isLargeSelection = selectedCount >= LARGE_SELECTION_THRESHOLD;

  if (session.status === 'scanning') {
    return (
      <div className="organize-scan">
        <OrganizeStatusView
          icon={<SpinnerIcon width={20} height={20} />}
          title={t('Scanning your bookmarks...')}
        />
      </div>
    );
  }

  if (session.status === 'selecting' && bookmarkStats) {
    return (
      <div className="organize-scan">
        <div className="organize-scan-stats">
          <div className="organize-scan-stats-header">
            <p className="organize-scan-stats-summary">
              {t('Found {bookmarks} bookmarks in {folders} folders', { bookmarks: bookmarkStats.totalBookmarks, folders: bookmarkStats.totalFolders })}
            </p>
            <Button
              variant="unstyled"
              className="organize-scan-rescan-btn"
              onClick={onStartScan}
              title={t('Re-scan to get the latest bookmark data')}
            >
              <RefreshIcon width={12} height={12} />
            </Button>
          </div>

          <div className="organize-scan-bulk-actions">
            <Button onClick={onSelectAll}>{t('Select All')}</Button>
            <Button onClick={onDeselectAll}>{t('Deselect All')}</Button>
          </div>

          {duplicateCount > 0 && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowDuplicates(previous => !previous)}
            >
              {showDuplicates
                ? t(duplicateCount === 1 ? 'Hide {count} duplicate bookmark' : 'Hide {count} duplicate bookmarks', { count: duplicateCount })
                : t(duplicateCount === 1 ? 'Review {count} duplicate bookmark' : 'Review {count} duplicate bookmarks', { count: duplicateCount })}
            </Button>
          )}

          {showDuplicates && duplicateCount > 0 && (
            <OrganizeDuplicates groups={duplicateGroups} onRemove={onRemoveDuplicates} />
          )}

          <div className="organize-scan-folder-list">
            {folderTree.children.map(topLevelNode => (
              <TreeNode
                key={topLevelNode.path}
                node={topLevelNode}
                depth={0}
                selectedSet={selectedSet}
                expandedPaths={expandedPaths}
                onToggleBookmarks={onToggleBookmarks}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </div>

        {isLargeSelection && (
          <p className="organize-scan-heads-up">
            {t("You've selected {count} bookmarks. Organizing this many can take a few minutes — you can also do it in smaller groups.", { count: selectedCount.toLocaleString(language) })}
          </p>
        )}

        <div className="organize-scan-destination">
          <Dropdown
            label={t('Move organized bookmarks into')}
            options={destinationOptions}
            selectedId={destinationLabel ? session.destinationFolderId ?? NO_DESTINATION_ID : NO_DESTINATION_ID}
            onSelect={onSelectDestination}
          />
          <p className="organize-scan-destination-hint">
            {destinationLabel
              ? t('New folders are created inside "{folder}". Only the bookmarks you selected above move; everything else stays where it is.', { folder: destinationLabel })
              : t('MarkMind picks the best folder anywhere in your bookmarks. Only the bookmarks you selected above move.')}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onStartPlanning}
          disabled={selectedCount === 0}
          fullWidth
        >
          {t('Organize Selected ({count})', { count: selectedCount })}
        </Button>
      </div>
    );
  }

  return (
    <div className="organize-scan">
      <div className="organize-scan-intro">
        <div className="organize-scan-intro-icon">
          <FolderIcon width={20} height={20} />
        </div>
        <p className="organize-scan-intro-title">{t('Time to tidy up')}</p>
        <p className="organize-scan-intro-description">
          {t("We'll analyze your bookmarks and organize them into the perfect folder structure for you.")}
        </p>
        <Button variant="primary" onClick={onStartScan} fullWidth>
          {t('Scan My Bookmarks')}
        </Button>
      </div>
    </div>
  );
};

export default OrganizeScan;
