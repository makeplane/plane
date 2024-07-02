import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { ArchiveIcon, Tooltip } from "@plane/ui";
// constants
import { ARCHIVABLE_STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProjectState } from "@/hooks/store";
// plane web components
import { BulkArchiveConfirmationModal } from "@/plane-web/components/issues";

type Props = {
  handleClearSelection: () => void;
  selectedIssueIds: string[];
};

export const BulkArchiveIssues: React.FC<Props> = observer((props) => {
  const { handleClearSelection, selectedIssueIds } = props;
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useParams();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const canAllIssuesBeArchived = selectedIssueIds.every((issueId) => {
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
          issueIds={selectedIssueIds}
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
