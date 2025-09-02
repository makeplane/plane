import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ARCHIVABLE_STATE_GROUPS } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { ArchiveIcon, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web components
import { BulkArchiveConfirmationModal } from "../modals";

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
        tooltipContent={
          canAllIssuesBeArchived ? "" : "The selected work items are not in the right state group to archive"
        }
      >
        <button
          type="button"
          className={cn("outline-none grid place-items-center", {
            "cursor-not-allowed text-custom-text-400": !canAllIssuesBeArchived,
          })}
          onClick={() => {
            canAllIssuesBeArchived
              ? setIsBulkArchiveModalOpen(true)
              : setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Only cancelled or completed work items can be archived.",
                });
          }}
        >
          <ArchiveIcon className="size-4" />
        </button>
      </Tooltip>
    </>
  );
});
