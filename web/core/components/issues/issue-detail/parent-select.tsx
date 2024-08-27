"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
// ui
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ParentIssuesListModal } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
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
  const {
    isParentIssueModalOpen,
    toggleParentIssueModal,
    removeSubIssue,
    subIssues: { setSubIssueHelpers, fetchSubIssues },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  const parentIssue = issue?.parent_id ? getIssueById(issue.parent_id) : undefined;
  const parentIssueProjectDetails =
    parentIssue && parentIssue.project_id ? getProjectById(parentIssue.project_id) : undefined;
  const { isMobile } = usePlatformOS();
  const handleParentIssue = async (_issueId: string | null = null) => {
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: _issueId });
      await issueOperations.fetch(workspaceSlug, projectId, issueId, false);
      _issueId && (await fetchSubIssues(workspaceSlug, projectId, _issueId));
      toggleParentIssueModal(null);
    } catch (error) {
      console.error("something went wrong while fetching the issue");
    }
  };

  const handleRemoveSubIssue = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string
  ) => {
    try {
      setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
      await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
      await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
      setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong",
      });
    }
  };

  if (!issue) return <></>;

  return (
    <>
      <ParentIssuesListModal
        projectId={projectId}
        issueId={issueId}
        isOpen={isParentIssueModalOpen === issueId}
        handleClose={() => toggleParentIssueModal(null)}
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
        onClick={() => toggleParentIssueModal(issue.id)}
        disabled={disabled}
      >
        {issue.parent_id && parentIssue ? (
          <div className="flex items-center gap-1 bg-green-500/20 rounded px-1.5 py-1">
            <Tooltip tooltipHeading="Title" tooltipContent={parentIssue.name} isMobile={isMobile}>
              <Link
                href={`/${workspaceSlug}/projects/${parentIssue.project_id}/issues/${parentIssue?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {parentIssue?.project_id && parentIssueProjectDetails && (
                  <IssueIdentifier
                    projectId={parentIssue.project_id}
                    issueTypeId={parentIssue.type_id}
                    projectIdentifier={parentIssueProjectDetails?.identifier}
                    issueSequenceId={parentIssue.sequence_id}
                    textContainerClassName="text-xs font-medium text-green-700"
                  />
                )}
              </Link>
            </Tooltip>

            {!disabled && (
              <Tooltip tooltipContent="Remove" position="bottom" isMobile={isMobile}>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveSubIssue(workspaceSlug, projectId, parentIssue.id, issueId);
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
