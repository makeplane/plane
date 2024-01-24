import React from "react";
import { ChevronDown, ChevronRight, X, Pencil, Trash, Link as LinkIcon, Loader } from "lucide-react";
// components
import { IssueList } from "./issues-list";
import { IssueProperty } from "./properties";
// ui
import { ControlLink, CustomMenu, Tooltip } from "@plane/ui";
// types
import { TIssue } from "@plane/types";
import { TSubIssueOperations } from "./root";
// import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";
import { useIssueDetail, useProject, useProjectState } from "hooks/store";
import { observer } from "mobx-react-lite";

export interface ISubIssues {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
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
    issueId,
    spacingLeft = 10,
    disabled,
    handleIssueCrudState,
    subIssueOperations,
  } = props;

  const {
    setPeekIssue,
    issue: { getIssueById },
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
  } = useIssueDetail();
  const project = useProject();
  const { getProjectStates } = useProjectState();

  const issue = getIssueById(issueId);
  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;
  const currentIssueStateDetail =
    (issue?.project_id && getProjectStates(issue?.project_id)?.find((state) => issue?.state_id == state.id)) ||
    undefined;

  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  if (!issue) return <></>;
  return (
    <div key={issueId}>
      {issue && (
        <div
          className="group relative flex h-full w-full items-center gap-2 border-b border-custom-border-100 px-2 py-1 transition-all hover:bg-custom-background-90"
          style={{ paddingLeft: `${spacingLeft}px` }}
        >
          <div className="h-[22px] w-[22px] flex-shrink-0">
            {issue?.sub_issues_count > 0 && (
              <>
                {subIssueHelpers.preview_loader.includes(issue.id) ? (
                  <div className="flex h-full w-full cursor-not-allowed items-center justify-center rounded-sm bg-custom-background-80 transition-all">
                    <Loader width={14} strokeWidth={2} className="animate-spin" />
                  </div>
                ) : (
                  <div
                    className="flex h-full w-full cursor-pointer items-center justify-center rounded-sm transition-all hover:bg-custom-background-80"
                    onClick={async () => {
                      if (!subIssueHelpers.issue_visibility.includes(issueId)) {
                        setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                        await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, issueId);
                        setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                      }
                      setSubIssueHelpers(parentIssueId, "issue_visibility", issueId);
                    }}
                  >
                    {subIssueHelpers.issue_visibility.includes(issue.id) ? (
                      <ChevronDown width={14} strokeWidth={2} />
                    ) : (
                      <ChevronRight width={14} strokeWidth={2} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex w-full cursor-pointer items-center gap-2">
            <div
              className="h-[6px] w-[6px] flex-shrink-0 rounded-full"
              style={{
                backgroundColor: currentIssueStateDetail?.color,
              }}
            />
            <div className="flex-shrink-0 text-xs text-custom-text-200">
              {projectDetail?.identifier}-{issue?.sequence_id}
            </div>

            <ControlLink
              href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
              target="_blank"
              onClick={() => handleIssuePeekOverview(issue)}
              className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
            >
              <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                <span>{issue.name}</span>
              </Tooltip>
            </ControlLink>
          </div>

          <div className="flex-shrink-0 text-sm">
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
                <CustomMenu.MenuItem onClick={() => handleIssueCrudState("update", parentIssueId, { ...issue })}>
                  <div className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>Edit issue</span>
                  </div>
                </CustomMenu.MenuItem>
              )}

              {disabled && (
                <CustomMenu.MenuItem onClick={() => handleIssueCrudState("delete", parentIssueId, issue)}>
                  <div className="flex items-center gap-2">
                    <Trash className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>Delete issue</span>
                  </div>
                </CustomMenu.MenuItem>
              )}

              <CustomMenu.MenuItem
                onClick={() =>
                  subIssueOperations.copyText(`${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`)
                }
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Copy issue link</span>
                </div>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>

          {disabled && (
            <>
              {subIssueHelpers.issue_loader.includes(issue.id) ? (
                <div className="flex h-[22px] w-[22px] flex-shrink-0 cursor-not-allowed items-center justify-center overflow-hidden rounded-sm transition-all">
                  <Loader width={14} strokeWidth={2} className="animate-spin" />
                </div>
              ) : (
                <div
                  className="invisible flex h-[22px] w-[22px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80 group-hover:visible"
                  onClick={() => {
                    subIssueOperations.removeSubIssue(workspaceSlug, issue.project_id, parentIssueId, issue.id);
                  }}
                >
                  <X width={14} strokeWidth={2} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {subIssueHelpers.issue_visibility.includes(issueId) && issue.sub_issues_count && issue.sub_issues_count > 0 && (
        <IssueList
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          parentIssueId={issue.id}
          spacingLeft={spacingLeft + 22}
          disabled={disabled}
          handleIssueCrudState={handleIssueCrudState}
          subIssueOperations={subIssueOperations}
        />
      )}
    </div>
  );
});
