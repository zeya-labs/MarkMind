import { DocumentIcon } from '../icons/Icons';
import { splitFolderPath } from '../../utils/folders';
import { stripRootSegment } from '../../utils/folderDisplay';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import './BookmarkTreePath.css';
import { useI18n } from '../../i18n';

interface BookmarkTreePathProps {
  folderPath: string;
  bookmarkTitle: string;
  isNewFolder: boolean;
  label?: string;
  defaultExpanded?: boolean;
}

const BookmarkTreePath = ({
  folderPath,
  bookmarkTitle,
  isNewFolder,
  label,
  defaultExpanded = true,
}: BookmarkTreePathProps) => {
  const { t } = useI18n();
  const cleanPath = stripRootSegment(folderPath);
  const displayPath = splitFolderPath(cleanPath).join(' / ');

  return (
    <div className="bookmark-tree-path">
      <span className="bookmark-tree-path-label">{label ?? t('Suggested location')}</span>
      <FolderTreeGroup
        groupName={displayPath}
        itemCount={1}
        badge={isNewFolder ? t('New') : undefined}
        defaultExpanded={defaultExpanded}
      >
        <div className="bookmark-tree-path-item">
          <DocumentIcon width={10} height={10} />
          <span className="bookmark-tree-path-bookmark-title">{bookmarkTitle}</span>
        </div>
      </FolderTreeGroup>
      {isNewFolder && (
        <span className="bookmark-tree-path-new-hint">{t('This folder will be created for you')}</span>
      )}
    </div>
  );
};

export default BookmarkTreePath;
