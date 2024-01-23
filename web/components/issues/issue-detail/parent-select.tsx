import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
// hooks
import { useIssueDetail, useProject } from "hooks/store";
import { Spinner } from "@plane/ui";
// components
import { ParentIssuesListModal } from "components/issues";
import { TIssueOperations } from "./root";

type TIssueParentSelect = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;

  disabled?: boolean;
};

export const IssueParentSelect: React.FC<TIssueParentSelect> = observer(
  ({ workspaceSlug, projectId, issueId, issueOperations, disabled = false }) => {
    // hooks
    const { getProjectById } = useProject();
    const {
      issue: { getIssueById },
    } = useIssueDetail();
    // state
    const { isParentIssueModalOpen, toggleParentIssueModal } = useIssueDetail();
    const [updating, setUpdating] = useState(false);

    const issue = getIssueById(issueId);

    const parentIssue = issue?.parent_id ? getIssueById(issue.parent_id) : undefined;
    const parentIssueProjectDetails =
      parentIssue && parentIssue.project_id ? getProjectById(parentIssue.project_id) : undefined;

    const handleParentIssue = async (_issueId: string | null = null) => {
      setUpdating(true);
      try {
        await issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: _issueId });
        await issueOperations.fetch(workspaceSlug, projectId, issueId);
        toggleParentIssueModal(false);
        setUpdating(false);
      } catch (error) {
        console.error("something went wrong while fetching the issue");
      }
    };

    if (!issue) return <></>;

    return (
      <div className="relative flex items-center gap-2">
        <ParentIssuesListModal
          projectId={projectId}
          issueId={issueId}
          isOpen={isParentIssueModalOpen}
          handleClose={() => toggleParentIssueModal(false)}
          onChange={(issue: any) => handleParentIssue(issue?.id)}
        />

        <button
          className={`flex items-center gap-2 rounded bg-custom-background-80 px-2.5 py-0.5 text-xs w-max max-w-max" ${
            disabled ? "cursor-not-allowed" : "cursor-pointer "
          }`}
          disabled={disabled}
        >
          <div onClick={() => toggleParentIssueModal(true)}>
            {issue?.parent_id && parentIssue ? (
              `${parentIssueProjectDetails?.identifier}-${parentIssue.sequence_id}`
            ) : (
              <span className="text-custom-text-200">Select issue</span>
            )}
          </div>

          {issue?.parent_id && parentIssue && !disabled && (
            <div onClick={() => handleParentIssue(null)}>
              <X className="h-2.5 w-2.5" />
            </div>
          )}
        </button>

        {updating && <Spinner className="h-4 w-4" />}
      </div>
    );
  }
);
