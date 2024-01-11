import React from "react";
import { ChevronDown, ChevronRight, X, Pencil, Trash, Link as LinkIcon, Loader } from "lucide-react";
// components
import { SubIssuesRootList } from "./issues-list";
import { IssueProperty } from "./properties";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// types
import { IUser, TIssue, TIssueSubIssues } from "@plane/types";
// import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";
import { useIssueDetail, useProject, useProjectState } from "hooks/store";

export interface ISubIssues {
  workspaceSlug: string;
  projectId: string;
  parentIssue: TIssue;
  issueId: string;
  handleIssue: {
    fetchIssues: (issueId: string) => Promise<TIssueSubIssues>;
    updateIssue: (issueId: string, data: Partial<TIssue>) => Promise<TIssue>;
    removeIssue: (issueId: string) => Promise<any>;
  };
  spacingLeft?: number;
  user: IUser | undefined;
  editable: boolean;
  removeIssueFromSubIssues: (parentIssueId: string, issue: TIssue) => void;
  issuesLoader: any; // FIXME: ISubIssuesRootLoaders replace with any
  handleIssuesLoader: ({ key, issueId }: any) => void; // FIXME: ISubIssuesRootLoadersHandler replace with any
  copyText: (text: string) => void;
  handleIssueCrudOperation: (
    key: "create" | "existing" | "edit" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  handleUpdateIssue: (issue: TIssue, data: Partial<TIssue>) => void;
}

export const SubIssues: React.FC<ISubIssues> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  issueId,
  spacingLeft = 0,
  user,
  editable,
  removeIssueFromSubIssues,
  issuesLoader,
  handleIssuesLoader,
  copyText,
  handleIssueCrudOperation,
  handleUpdateIssue,
}) => {
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const project = useProject();
  const { getProjectStates } = useProjectState();

  const issue = getIssueById(issueId);
  const projectDetail = project.getProjectById(projectId);
  const currentIssueStateDetail =
    (issue?.project_id && getProjectStates(issue?.project_id)?.find((state) => issue?.state_id == state.id)) ||
    undefined;

  return (
    <>
      <div>
        {issue && (
          <div
            className="group relative flex h-full w-full items-center gap-2 border-b border-custom-border-100 px-2 py-1 transition-all hover:bg-custom-background-90"
            style={{ paddingLeft: `${spacingLeft}px` }}
          >
            <div className="h-[22px] w-[22px] flex-shrink-0">
              {issue?.sub_issues_count > 0 && (
                <>
                  {issuesLoader.sub_issues.includes(issue?.id) ? (
                    <div className="flex h-full w-full cursor-not-allowed items-center justify-center rounded-sm bg-custom-background-80 transition-all">
                      <Loader width={14} strokeWidth={2} className="animate-spin" />
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full cursor-pointer items-center justify-center rounded-sm transition-all hover:bg-custom-background-80"
                      onClick={() => handleIssuesLoader({ key: "visibility", issueId: issue?.id })}
                    >
                      {issuesLoader && issuesLoader.visibility.includes(issue?.id) ? (
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
              <Tooltip tooltipHeading="Title" tooltipContent={`${issue?.name}`}>
                <div className="line-clamp-1 pr-2 text-xs text-custom-text-100">{issue?.name}</div>
              </Tooltip>
            </div>

            <div className="flex-shrink-0 text-sm">
              <IssueProperty
                workspaceSlug={workspaceSlug}
                parentIssue={parentIssue}
                issue={issue}
                editable={editable}
              />
            </div>

            <div className="flex-shrink-0 text-sm">
              <CustomMenu width="auto" placement="bottom-end" ellipsis>
                {editable && (
                  <CustomMenu.MenuItem onClick={() => handleIssueCrudOperation("edit", parentIssue?.id, issue)}>
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Edit issue</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {editable && (
                  <CustomMenu.MenuItem onClick={() => handleIssueCrudOperation("delete", parentIssue?.id, issue)}>
                    <div className="flex items-center gap-2">
                      <Trash className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Delete issue</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                <CustomMenu.MenuItem
                  onClick={() => copyText(`${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>Copy issue link</span>
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>

            {editable && (
              <>
                {issuesLoader.delete.includes(issue?.id) ? (
                  <div className="flex h-[22px] w-[22px] flex-shrink-0 cursor-not-allowed items-center justify-center overflow-hidden rounded-sm bg-red-200/10 text-red-500 transition-all">
                    <Loader width={14} strokeWidth={2} className="animate-spin" />
                  </div>
                ) : (
                  <div
                    className="invisible flex h-[22px] w-[22px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80 group-hover:visible"
                    onClick={() => {
                      handleIssuesLoader({ key: "delete", issueId: issue?.id });
                      removeIssueFromSubIssues(parentIssue?.id, issue);
                    }}
                  >
                    <X width={14} strokeWidth={2} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {issuesLoader.visibility.includes(issueId) && issue?.sub_issues_count && issue?.sub_issues_count > 0 && (
          <SubIssuesRootList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            parentIssue={issue}
            spacingLeft={spacingLeft + 22}
            user={user}
            editable={editable}
            removeIssueFromSubIssues={removeIssueFromSubIssues}
            issuesLoader={issuesLoader}
            handleIssuesLoader={handleIssuesLoader}
            copyText={copyText}
            handleIssueCrudOperation={handleIssueCrudOperation}
            handleUpdateIssue={handleUpdateIssue}
          />
        )}
      </div>
    </>
  );
};
