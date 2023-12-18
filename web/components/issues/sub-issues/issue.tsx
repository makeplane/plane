import { useRouter } from "next/router";
import React from "react";
import { ChevronDown, ChevronRight, X, Pencil, Trash, Link as LinkIcon, Loader } from "lucide-react";
// components
import { SubIssuesRootList } from "./issues-list";
import { IssueProperty } from "./properties";
import { IssuePeekOverview } from "components/issues";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// types
import { IUser, IIssue } from "types";
import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";

export interface ISubIssues {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
  issue: any;
  spacingLeft?: number;
  user: IUser | undefined;
  editable: boolean;
  removeIssueFromSubIssues: (parentIssueId: string, issue: IIssue) => void;
  issuesLoader: ISubIssuesRootLoaders;
  handleIssuesLoader: ({ key, issueId }: ISubIssuesRootLoadersHandler) => void;
  copyText: (text: string) => void;
  handleIssueCrudOperation: (
    key: "create" | "existing" | "edit" | "delete",
    issueId: string,
    issue?: IIssue | null
  ) => void;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
}

export const SubIssues: React.FC<ISubIssues> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  issue,
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
  const router = useRouter();
  const { peekProjectId, peekIssueId } = router.query;

  const handleIssuePeekOverview = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { query } = router;
    if (event.ctrlKey || event.metaKey) {
      const issueUrl = `/${issue.workspace_detail.slug}/projects/${issue.project_detail.id}/issues/${issue?.id}`;
      window.open(issueUrl, "_blank"); // Open link in a new tab
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
      });
    }
  };

  return (
    <>
      {workspaceSlug && peekProjectId && peekIssueId && peekIssueId === issue.id && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate) => await handleUpdateIssue(issue, { ...issue, ...issueToUpdate })}
        />
      )}
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

            <div className="flex w-full cursor-pointer items-center gap-2" onClick={handleIssuePeekOverview}>
              <div
                className="h-[6px] w-[6px] flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: issue.state_detail.color,
                }}
              />
              <div className="flex-shrink-0 text-xs text-custom-text-200">
                {issue.project_detail.identifier}-{issue?.sequence_id}
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
                  onClick={() => copyText(`${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`)}
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

        {issuesLoader.visibility.includes(issue?.id) && issue?.sub_issues_count > 0 && (
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
