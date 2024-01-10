import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { X, CopyPlus } from "lucide-react";
// hooks
import { useIssueDetail, useIssues, useProject, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
// icons
import { BlockerIcon, BlockedIcon, RelatedIcon } from "@plane/ui";
// types
import { TIssueRelationTypes, ISearchIssueResponse } from "@plane/types";

export type TRelationObject = { name: string; icon: (size: number) => any; className: string };

const issueRelationObject: Record<TIssueRelationTypes, TRelationObject> = {
  blocking: {
    name: "Blocking",
    icon: (size: number = 16) => <BlockerIcon height={size} width={size} />,
    className: "text-yellow-500 duration-300 hover:border-yellow-500/20 hover:bg-yellow-500/20",
  },
  blocked_by: {
    name: "Blocked by",
    icon: (size: number = 16) => <BlockedIcon height={size} width={size} />,
    className: "border-custom-border-200 text-red-500 hover:border-red-500/20 hover:bg-red-500/20",
  },
  duplicate: {
    name: "Duplicate",
    icon: (size: number = 16) => <CopyPlus height={size} width={size} />,
    className: "border-custom-border-200",
  },
  relates_to: {
    name: "Relates to",
    icon: (size: number = 16) => <RelatedIcon height={size} width={size} />,
    className: "border-custom-border-200",
  },
};

type TIssueRelationSelect = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  relationKey: TIssueRelationTypes;
  disabled?: boolean;
};

export const IssueRelationSelect: React.FC<TIssueRelationSelect> = observer((props) => {
  const { workspaceSlug, projectId, issueId, relationKey, disabled = false } = props;
  // hooks
  const { currentUser } = useUser();
  const { getProjectById } = useProject();
  const {
    createRelation,
    removeRelation,
    relation: { getRelationByIssueIdRelationType },
  } = useIssueDetail();
  const { issueMap } = useIssues();
  // states
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  // toast alert
  const { setToastAlert } = useToast();

  const relationIssueIds = getRelationByIssueIdRelationType(issueId as string, relationKey);

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
      workspaceSlug as string,
      projectId as string,
      issueId as string,
      relationKey,
      data.map((i) => i.id)
    );

    setIsRelationModalOpen(false);
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isRelationModalOpen}
        handleClose={() => setIsRelationModalOpen(false)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />

      <div className="flex flex-wrap items-start py-2">
        <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
          {relationKey && issueRelationObject[relationKey] && (
            <>
              {issueRelationObject[relationKey].icon(16)}
              <p>{issueRelationObject[relationKey].name}</p>
            </>
          )}
        </div>

        <div className="space-y-1 sm:basis-1/2">
          <div className="flex flex-wrap gap-1">
            {relationIssueIds && relationIssueIds.length > 0
              ? relationIssueIds.map((relationIssueId: any) => {
                  const currentIssue = issueMap[relationIssueId];
                  if (!currentIssue) return;

                  const projectDetails = getProjectById(currentIssue.project_id);

                  return (
                    <div
                      key={relationIssueId}
                      className={`group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs duration-300 ${issueRelationObject[relationKey].className}`}
                    >
                      <a
                        href={`/${workspaceSlug}/projects/${projectDetails?.id}/issues/${relationIssueId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        {issueRelationObject[relationKey].icon(10)}
                        {`${projectDetails?.identifier}-${currentIssue?.sequence_id}`}
                      </a>
                      <button
                        type="button"
                        className="opacity-0 duration-300 group-hover:opacity-100"
                        onClick={() => {
                          if (!currentUser) return;
                          removeRelation(
                            workspaceSlug as string,
                            projectId as string,
                            issueId,
                            relationKey,
                            relationIssueId
                          );
                        }}
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  );
                })
              : null}
          </div>

          <button
            type="button"
            className={`rounded bg-custom-background-80 px-2.5 py-0.5 text-xs text-custom-text-200 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
            }`}
            onClick={() => setIsRelationModalOpen(true)}
            disabled={disabled}
          >
            Select issues
          </button>
        </div>
      </div>
    </>
  );
});
