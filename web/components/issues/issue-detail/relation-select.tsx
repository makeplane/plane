import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { CircleDot, CopyPlus, Pencil, X, XCircle } from "lucide-react";
import { TIssueRelationTypes, ISearchIssueResponse } from "@plane/types";
// hooks
import { RelatedIcon, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
import { cn } from "@/helpers/common.helper";
import { useIssueDetail, useIssues, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
// ui
// helpers
// types

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
  const { isMobile } = usePlatformOS();
  const relationIssueIds = getRelationByIssueIdRelationType(issueId, relationKey);

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (data.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
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

    toggleRelationModal(null, null);
  };

  if (!relationIssueIds) return null;

  const isRelationKeyModalActive =
    isRelationModalOpen?.relationType === relationKey && isRelationModalOpen?.issueId === issueId;

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationKeyModalActive}
        handleClose={() => toggleRelationModal(null, null)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />

      <button
        type="button"
        className={cn(
          "group flex items-center gap-2 rounded px-2 py-0.5 outline-none",
          {
            "cursor-not-allowed": disabled,
            "hover:bg-custom-background-80": !disabled,
            "bg-custom-background-80": isRelationKeyModalActive,
          },
          className
        )}
        onClick={() => toggleRelationModal(issueId, relationKey)}
        disabled={disabled}
      >
        <div className="flex w-full items-start justify-between">
          {relationIssueIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 py-0.5">
              {relationIssueIds.map((relationIssueId) => {
                const currentIssue = issueMap[relationIssueId];
                if (!currentIssue) return;

                const projectDetails = getProjectById(currentIssue.project_id);

                return (
                  <div
                    key={relationIssueId}
                    className={`group flex items-center gap-1 rounded px-1.5 pb-1 pt-1 leading-3 hover:bg-custom-background-90 ${issueRelationObject[relationKey].className}`}
                  >
                    <Tooltip tooltipHeading="Title" tooltipContent={currentIssue.name} isMobile={isMobile}>
                      <Link
                        href={`/${workspaceSlug}/projects/${projectDetails?.id}/issues/${currentIssue.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {`${projectDetails?.identifier}-${currentIssue?.sequence_id}`}
                      </Link>
                    </Tooltip>
                    {!disabled && (
                      <Tooltip tooltipContent="Remove" position="bottom" isMobile={isMobile}>
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
          {!disabled && (
            <span
              className={cn("flex-shrink-0 p-1 opacity-0 group-hover:opacity-100", {
                "text-custom-text-400": relationIssueIds.length === 0,
              })}
            >
              <Pencil className="h-2.5 w-2.5 flex-shrink-0" />
            </span>
          )}
        </div>
      </button>
    </>
  );
});
