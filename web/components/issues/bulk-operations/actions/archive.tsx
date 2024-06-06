import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { ArchiveIcon, Tooltip } from "@plane/ui";
// components
// constants
import { ARCHIVABLE_STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter, useIssueDetail, useProjectState } from "@/hooks/store";
import { BulkArchiveConfirmationModal } from "../bulk-archive-modal";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkArchiveIssues: React.FC<Props> = observer((props) => {
  const { handleClearSelection, selectedEntityIds } = props;
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useAppRouter();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const canAllIssuesBeArchived = selectedEntityIds.every((issueId) => {
    const issueDetails = getIssueById(issueId);
    if (!issueDetails) return false;
    const stateDetails = getStateById(issueDetails.state_id);
    if (!stateDetails) return false;
    return ARCHIVABLE_STATE_GROUPS.includes(stateDetails.group);
  });

  return (
    <>
      {projectId && workspaceSlug && (
        <BulkArchiveConfirmationModal
          isOpen={isBulkArchiveModalOpen}
          handleClose={() => setIsBulkArchiveModalOpen(false)}
          issueIds={selectedEntityIds}
          onSubmit={handleClearSelection}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Tooltip
        tooltipHeading="Archive"
        tooltipContent={canAllIssuesBeArchived ? "" : "The selected issues are not in the right state group to archive"}
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
    </>
  );
});
