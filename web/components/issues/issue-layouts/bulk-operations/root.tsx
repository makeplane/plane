import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, Checkbox, Tooltip } from "@plane/ui";
// components
import {
  BulkArchiveConfirmationModal,
  BulkDeleteConfirmationModal,
  IssueBulkOperationsProperties,
} from "@/components/issues";
// constants
import { ARCHIVABLE_STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useMultipleSelectStore, useProjectState } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className, selectionHelpers } = props;
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  // derived values
  const { handleClearSelection } = selectionHelpers;
  const canAllIssuesBeArchived = selectedEntityIds.every((issueId) => {
    const issueDetails = getIssueById(issueId);
    if (!issueDetails) return false;
    const stateDetails = getStateById(issueDetails.state_id);
    if (!stateDetails) return false;
    return ARCHIVABLE_STATE_GROUPS.includes(stateDetails.group);
  });

  if (!isSelectionActive) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] h-14", className)}>
      {workspaceSlug && projectId && (
        <>
          <BulkArchiveConfirmationModal
            isOpen={isBulkArchiveModalOpen}
            handleClose={() => setIsBulkArchiveModalOpen(false)}
            issueIds={selectedEntityIds}
            onSubmit={handleClearSelection}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
          <BulkDeleteConfirmationModal
            isOpen={isBulkDeleteModalOpen}
            handleClose={() => setIsBulkDeleteModalOpen(false)}
            issueIds={selectedEntityIds}
            onSubmit={handleClearSelection}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        </>
      )}
      <div className="size-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-custom-border-200 text-custom-text-300">
        <div className="h-7 pr-3 text-sm flex items-center gap-2 flex-shrink-0">
          <Checkbox
            className="!outline-none size-3.5"
            iconClassName="size-3"
            onClick={selectionHelpers.handleClearSelection}
            indeterminate
          />
          <div className="flex items-center gap-1">
            <span
              className="flex-shrink-0"
              style={{ minWidth: `${Math.max(8, String(selectedEntityIds.length).length * 8)}px` }}
            >
              {selectedEntityIds.length}
            </span>
            selected
          </div>
        </div>
        <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
          <Tooltip
            tooltipHeading="Archive"
            tooltipContent={
              canAllIssuesBeArchived ? "" : "The selected issues are not in the right state group to archive"
            }
          >
            <button
              type="button"
              className={cn("outline-none grid place-items-center", {
                "cursor-not-allowed text-custom-text-400": !canAllIssuesBeArchived,
              })}
              onClick={() => {
                if (canAllIssuesBeArchived) setIsBulkArchiveModalOpen(true);
              }}
            >
              <ArchiveIcon className="size-4" />
            </button>
          </Tooltip>
          <Tooltip tooltipHeading="Delete" tooltipContent="">
            <button
              type="button"
              className="outline-none grid place-items-center"
              onClick={() => setIsBulkDeleteModalOpen(true)}
            >
              <Trash2 className="size-4" />
            </button>
          </Tooltip>
        </div>
        <div className="h-7 pl-3 flex-grow">
          <IssueBulkOperationsProperties
            selectionHelpers={selectionHelpers}
            snapshot={{ isSelectionActive, selectedEntityIds }}
          />
        </div>
      </div>
    </div>
  );
});
