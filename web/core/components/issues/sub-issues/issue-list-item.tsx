"use client";

import React from "react";
import { observer } from "mobx-react";
import { ChevronRight, X, Pencil, Trash, Link as LinkIcon, Loader } from "lucide-react";
import { TIssue } from "@plane/types";
// ui
import { ControlLink, CustomMenu, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject, useProjectState } from "@/hooks/store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
// local components
import { IssueList } from "./issues-list";
import { IssueProperty } from "./properties";
// ui
// types
import { TSubIssueOperations } from "./root";
// import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";

export interface ISubIssues {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  disabled: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueId: string;
}

export const IssueListItem: React.FC<ISubIssues> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    issueId,
    spacingLeft = 10,
    disabled,
    handleIssueCrudState,
    subIssueOperations,
  } = props;

  const {
    issue: { getIssueById },
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
    toggleCreateIssueModal,
    toggleDeleteIssueModal,
  } = useIssueDetail();
  const project = useProject();
  const { getProjectStates } = useProjectState();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { isMobile } = usePlatformOS();
  const issue = getIssueById(issueId);

  // derived values
  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;
  const currentIssueStateDetail =
    (issue?.project_id && getProjectStates(issue?.project_id)?.find((state) => issue?.state_id == state.id)) ||
    undefined;

  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);
  const subIssueCount = issue?.sub_issues_count ?? 0;

  //
  const handleIssuePeekOverview = (issue: TIssue) => handleRedirection(workspaceSlug, issue, isMobile);

  if (!issue) return <></>;

  // check if current issue is the root issue
  const isCurrentIssueRoot = issueId === rootIssueId;

  return (
    <div key={issueId}>
      <ControlLink
        id={`issue-${issue.id}`}
        href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
        onClick={() => handleIssuePeekOverview(issue)}
        className="w-full cursor-pointer"
      >
        {issue && (
          <div
            className="group relative flex min-h-11 h-full w-full items-center gap-3 pr-2 py-1 transition-all hover:bg-custom-background-90"
            style={{ paddingLeft: `${spacingLeft}px` }}
          >
            <div className="flex size-5 items-center justify-center flex-shrink-0">
              {/* disable the chevron when current issue is also the root issue*/}
              {subIssueCount > 0 && !isCurrentIssueRoot && (
                <>
                  {subIssueHelpers.preview_loader.includes(issue.id) ? (
                    <div className="flex h-full w-full cursor-not-allowed items-center justify-center rounded-sm bg-custom-background-80 transition-all">
                      <Loader width={14} strokeWidth={2} className="animate-spin" />
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full cursor-pointer items-center justify-center text-custom-text-400 hover:text-custom-text-300"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!subIssueHelpers.issue_visibility.includes(issueId)) {
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                          await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, issueId);
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                        }
                        setSubIssueHelpers(parentIssueId, "issue_visibility", issueId);
                      }}
                    >
                      <ChevronRight
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": subIssueHelpers.issue_visibility.includes(issue.id),
                        })}
                        strokeWidth={2.5}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex w-full truncate cursor-pointer items-center gap-3">
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: currentIssueStateDetail?.color ?? "#737373",
                }}
              />
              <div className="flex-shrink-0">
                {projectDetail && (
                  <IssueIdentifier
                    projectId={projectDetail.id}
                    issueTypeId={issue.type_id}
                    projectIdentifier={projectDetail.identifier}
                    issueSequenceId={issue.sequence_id}
                    textContainerClassName="text-xs text-custom-text-200"
                  />
                )}
              </div>
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <span className="w-full truncate text-sm text-custom-text-100">{issue.name}</span>
              </Tooltip>
            </div>

            <div
              className="flex-shrink-0 text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <IssueProperty
                workspaceSlug={workspaceSlug}
                parentIssueId={parentIssueId}
                issueId={issueId}
                disabled={disabled}
                subIssueOperations={subIssueOperations}
              />
            </div>

            <div className="flex-shrink-0 text-sm">
              <CustomMenu placement="bottom-end" ellipsis>
                {disabled && (
                  <CustomMenu.MenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleIssueCrudState("update", parentIssueId, { ...issue });
                      toggleCreateIssueModal(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Edit issue</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                <CustomMenu.MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    subIssueOperations.copyText(`${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>Copy issue link</span>
                  </div>
                </CustomMenu.MenuItem>

                {disabled && (
                  <CustomMenu.MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (issue.project_id)
                        subIssueOperations.removeSubIssue(workspaceSlug, issue.project_id, parentIssueId, issue.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Remove parent issue</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {disabled && (
                  <CustomMenu.MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleIssueCrudState("delete", parentIssueId, issue);
                      toggleDeleteIssueModal(issue.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Trash className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Delete issue</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            </div>
          </div>
        )}
      </ControlLink>

      {/* should not expand the current issue if it is also the root issue*/}
      {subIssueHelpers.issue_visibility.includes(issueId) &&
        issue.project_id &&
        subIssueCount > 0 &&
        !isCurrentIssueRoot && (
          <IssueList
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            parentIssueId={issue.id}
            rootIssueId={rootIssueId}
            spacingLeft={spacingLeft + 22}
            disabled={disabled}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
          />
        )}
    </div>
  );
});
