import { useBulkOrganize } from '../../hooks/useBulkOrganize';
import { formatElapsedTime } from '../../utils/helpers';
import { SpinnerIcon } from '../icons/Icons';
import Button from '../Button/Button';
import OrganizeScan from '../OrganizeScan/OrganizeScan';
import OrganizeReview from '../OrganizeReview/OrganizeReview';
import OrganizeComplete from '../OrganizeComplete/OrganizeComplete';
import OrganizeError from '../OrganizeError/OrganizeError';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import { type OrganizeSession } from '../../types/organize';
import { formatDestinationLabel } from '../../utils/destination';
import { useI18n } from '../../i18n';

const getDestinationLabel = (session: OrganizeSession): string | undefined => {
  const destination = (session.destinationFolders ?? []).find(folder => folder.id === session.destinationFolderId);
  return destination ? formatDestinationLabel(destination.path) : undefined;
};

interface OrganizeTabProps {
  hasConfiguredProvider: boolean;
  onOpenSettings: () => void;
}

const OrganizeTab = ({ hasConfiguredProvider, onOpenSettings }: OrganizeTabProps) => {
  const { t, language } = useI18n();
  const {
    session,
    bookmarkStats,
    statusMessage,
    statusType,
    elapsedSeconds,
    organizeProgress,
    handleStartScan,
    handleRemoveDuplicates,
    handleToggleBookmarks,
    handleSelectAll,
    handleDeselectAll,
    handleSelectDestination,
    handleStartOrganizing,
    handleCancelOrganizing,
    handleReOrganize,
    handleToggleGroupAssignments,
    handleSelectAllAssignments,
    handleDeselectAllAssignments,
    handleToggleAssignment,
    handleApplyMoves,
    handleReset,
  } = useBulkOrganize();

  switch (session.status) {
    case 'idle':
    case 'scanning':
    case 'selecting':
      return (
        <OrganizeScan
          session={session}
          bookmarkStats={bookmarkStats}
          onStartScan={handleStartScan}
          onToggleBookmarks={handleToggleBookmarks}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onSelectDestination={handleSelectDestination}
          onStartPlanning={hasConfiguredProvider ? handleStartOrganizing : onOpenSettings}
          onRemoveDuplicates={handleRemoveDuplicates}
        />
      );

    case 'organizing': {
      // Once a pass completes we have a real count to show — more honest than the
      // rotating messages, which carry the wait until the first pass finishes.
      const organizingTitle = organizeProgress
        ? t('Organized {processed} of {total} bookmarks...', { processed: organizeProgress.processed.toLocaleString(language), total: organizeProgress.total.toLocaleString(language) })
        : statusType === 'loading' && statusMessage
          ? statusMessage
          : t('Analyzing your bookmarks...');

      return (
        <OrganizeStatusView
          icon={<SpinnerIcon width={24} height={24} />}
          title={organizingTitle}
          description={t('Working for {time} — feel free to close this popup. MarkMind keeps organizing in the background; come back anytime to check progress.', { time: formatElapsedTime(elapsedSeconds) })}
        >
          <Button onClick={handleCancelOrganizing} fullWidth>
            {t('Cancel')}
          </Button>
        </OrganizeStatusView>
      );
    }

    case 'reviewing_assignments':
      return (
        <OrganizeReview
          assignments={session.assignments}
          folderPlan={session.folderPlan}
          destinationLabel={getDestinationLabel(session)}
          onToggleGroupAssignments={handleToggleGroupAssignments}
          onSelectAll={handleSelectAllAssignments}
          onDeselectAll={handleDeselectAllAssignments}
          onToggleAssignment={handleToggleAssignment}
          onApplyMoves={handleApplyMoves}
          onReOrganize={hasConfiguredProvider ? handleReOrganize : onOpenSettings}
          onReset={handleReset}
        />
      );

    case 'applying':
      return (
        <OrganizeStatusView
          icon={<SpinnerIcon width={20} height={20} />}
          title={t('Moving bookmarks...')}
          description={t('Please wait while your bookmarks are being reorganized')}
        />
      );

    case 'completed':
      return (
        <OrganizeComplete
          session={session}
          onReset={handleReset}
        />
      );

    case 'error':
      return (
        <OrganizeError
          errorMessage={session.errorMessage}
          onReset={handleReset}
        />
      );

    default:
      return null;
  }
};

export default OrganizeTab;
