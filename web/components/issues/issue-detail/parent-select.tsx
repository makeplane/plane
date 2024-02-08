import React from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Pencil, X } from "lucide-react";
// hooks
import { useIssueDetail, useProject } from "hooks/store";
// components
import { ParentIssuesListModal } from "components/issues";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssueOperations } from "./root";

type TIssueParentSelect = {
  className?: string;
  disabled?: boolean;
  issueId: string;
  issueOperations: TIssueOperations;
  projectId: string;
  workspaceSlug: string;
};

export const IssueParentSelect: React.FC<TIssueParentSelect> = observer((props) => {
  const { className = "", disabled = false, issueId, issueOperations, projectId, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isParentIssueModalOpen, toggleParentIssueModal } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const parentIssue = issue?.parent_id ? getIssueById(issue.parent_id) : undefined;
  const parentIssueProjectDetails =
    parentIssue && parentIssue.project_id ? getProjectById(parentIssue.project_id) : undefined;

  const handleParentIssue = async (_issueId: string | null = null) => {
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: _issueId });
      await issueOperations.fetch(workspaceSlug, projectId, issueId);
      toggleParentIssueModal(false);
    } catch (error) {
      console.error("something went wrong while fetching the issue");
    }
  };

  if (!issue) return <></>;

  return (
    <>
      <ParentIssuesListModal
        projectId={projectId}
        issueId={issueId}
        isOpen={isParentIssueModalOpen}
        handleClose={() => toggleParentIssueModal(false)}
        onChange={(issue: any) => handleParentIssue(issue?.id)}
      />
      <button
        type="button"
        className={cn(
          "group flex items-center justify-between gap-2 px-2 py-0.5 rounded outline-none",
          {
            "cursor-not-allowed": disabled,
            "hover:bg-custom-background-80": !disabled,
            "bg-custom-background-80": isParentIssueModalOpen,
          },
          className
        )}
        onClick={() => toggleParentIssueModal(true)}
        disabled={disabled}
      >
        {issue.parent_id && parentIssue ? (
          <div className="flex items-center gap-1 bg-green-500/20 text-green-700 rounded px-1.5 py-1">
            <Tooltip tooltipHeading="Title" tooltipContent={parentIssue.name}>
              <Link
                href={`/${workspaceSlug}/projects/${projectId}/issues/${parentIssue?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {parentIssueProjectDetails?.identifier}-{parentIssue.sequence_id}
              </Link>
            </Tooltip>

            {!disabled && (
              <Tooltip tooltipContent="Remove" position="bottom">
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleParentIssue(null);
                  }}
                >
                  <X className="h-2.5 w-2.5 text-custom-text-300 hover:text-red-500" />
                </span>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-sm text-custom-text-400">Add parent issue</span>
        )}
        {!disabled && (
          <span
            className={cn("p-1 flex-shrink-0 opacity-0 group-hover:opacity-100", {
              "text-custom-text-400": !issue.parent_id && !parentIssue,
            })}
          >
            <Pencil className="h-2.5 w-2.5 flex-shrink-0" />
          </span>
        )}
      </button>
    </>
  );
});
