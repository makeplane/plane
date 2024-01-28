import React from "react";
import { observer } from "mobx-react-lite";
import { CircleDot, CopyPlus, Pencil, X, XCircle } from "lucide-react";
// hooks
import { useIssueDetail, useIssues, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
// ui
import { RelatedIcon, Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssueRelationTypes, ISearchIssueResponse } from "@plane/types";

export type TRelationObject = { className: string; icon: (size: number) => React.ReactElement; placeholder: string };

export const issueRelationObject: Record<TIssueRelationTypes, TRelationObject> = {
  relates_to: {
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <RelatedIcon height={size} width={size} />,
    placeholder: "Add related issues",
  },
  blocking: {
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} />,
    placeholder: "None",
  },
  blocked_by: {
    className: "bg-red-500/20 text-red-700",
    icon: (size) => <CircleDot size={size} />,
    placeholder: "None",
  },
  duplicate: {
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <CopyPlus size={size} />,
    placeholder: "None",
  },
};

type TIssueRelationSelect = {
  className?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  relationKey: TIssueRelationTypes;
  disabled?: boolean;
};

export const IssueRelationSelect: React.FC<TIssueRelationSelect> = observer((props) => {
  const { className = "", workspaceSlug, projectId, issueId, relationKey, disabled = false } = props;
  // hooks
  const { getProjectById } = useProject();
  const {
    createRelation,
    removeRelation,
    relation: { getRelationByIssueIdRelationType },
    isRelationModalOpen,
    toggleRelationModal,
  } = useIssueDetail();
  const { issueMap } = useIssues();
  // toast alert
  const { setToastAlert } = useToast();

  const relationIssueIds = getRelationByIssueIdRelationType(issueId, relationKey);

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (data.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one issue.",
      });
      return;
    }

    await createRelation(
      workspaceSlug,
      projectId,
      issueId,
      relationKey,
      data.map((i) => i.id)
    );

    toggleRelationModal(null);
  };

  if (!relationIssueIds) return null;

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationModalOpen === relationKey}
        handleClose={() => toggleRelationModal(null)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
      <button
        type="button"
        className={cn(
          "group flex items-center justify-between gap-2 px-2 py-0.5 rounded outline-none",
          {
            "cursor-not-allowed": disabled,
            "hover:bg-custom-background-80": !disabled,
          },
          className
        )}
        onClick={() => toggleRelationModal(relationKey)}
        disabled={disabled}
      >
        {relationIssueIds.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            {relationIssueIds.map((relationIssueId) => {
              const currentIssue = issueMap[relationIssueId];
              if (!currentIssue) return;

              const projectDetails = getProjectById(currentIssue.project_id);

              return (
                <div
                  key={relationIssueId}
                  className={`group flex items-center gap-1 rounded px-1.5 py-1 ${issueRelationObject[relationKey].className}`}
                >
                  <a
                    href={`/${workspaceSlug}/projects/${projectDetails?.id}/issues/${currentIssue.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {`${projectDetails?.identifier}-${currentIssue?.sequence_id}`}
                  </a>
                  {!disabled && (
                    <Tooltip tooltipContent="Remove">
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeRelation(workspaceSlug, projectId, issueId, relationKey, relationIssueId);
                        }}
                      >
                        <X className="h-2.5 w-2.5 text-custom-text-300 hover:text-red-500" />
                      </span>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-custom-text-400">{issueRelationObject[relationKey].placeholder}</span>
        )}
        {!disabled && <Pencil className="h-4 w-4 flex-shrink-0 hidden group-hover:inline" />}
      </button>
    </>
  );
});
