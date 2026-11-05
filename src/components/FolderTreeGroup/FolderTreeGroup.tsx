import { useState, useCallback, useId, type ReactNode } from 'react';
import { ArrowRightIcon } from '../icons/Icons';
import { useI18n } from '../../i18n';
import './FolderTreeGroup.css';

interface FolderTreeGroupProps {
  groupName: string;
  itemCount: number;
  badge?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const FolderTreeGroup = ({
  groupName,
  itemCount,
  badge,
  headerAction,
  children,
  defaultExpanded = false,
}: FolderTreeGroupProps) => {
  const { t } = useI18n();
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(previousExpanded => !previousExpanded);
  }, []);

  return (
    <div className="folder-tree-group">
      <div className="folder-tree-group-header">
        <button
          type="button"
          className="folder-tree-group-toggle"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          title={t(isExpanded ? 'Collapse {name}' : 'Expand {name}', { name: groupName })}
        >
          <span className={`folder-tree-chevron ${isExpanded ? 'expanded' : ''}`}>
            <ArrowRightIcon width={10} height={10} />
          </span>
          <span className="folder-tree-group-name">{groupName}</span>
          {badge && <span className="folder-tree-group-badge">{badge}</span>}
        </button>
        {headerAction && (
          <span className="folder-tree-group-action">
            {headerAction}
          </span>
        )}
        <span className="folder-tree-group-count">
          {itemCount}
        </span>
      </div>

      <div id={contentId} className="folder-tree-group-children" hidden={!isExpanded}>
        {isExpanded && children}
      </div>
    </div>
  );
};

export default FolderTreeGroup;
