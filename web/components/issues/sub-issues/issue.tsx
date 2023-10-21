import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
import { mutate } from "swr";
// lucide icons
import { ChevronDown, ChevronRight, X, Pencil, Trash, Link as LinkIcon, Loader } from "lucide-react";
// components
import { IssuePeekOverview } from "components/issues/peek-overview";
import { SubIssuesRootList } from "./issues-list";
import { IssueProperty } from "./properties";
// ui
import { CustomMenu } from "components/ui";
import { Tooltip } from "@plane/ui";
// types
import { IUser, IIssue } from "types";
import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";

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
}) => {
  const router = useRouter();
  const { query } = router;
  const { peekIssue } = query as { peekIssue: string };

  const openPeekOverview = (issue_id: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssue: issue_id },
    });
  };

  return (
    <div>
      {issue && (
        <div
          className="relative flex items-center gap-2 py-1 px-2 w-full h-full hover:bg-custom-background-90 group transition-all border-b border-custom-border-100"
          style={{ paddingLeft: `${spacingLeft}px` }}
        >
          <div className="flex-shrink-0 w-[22px] h-[22px]">
            {issue?.sub_issues_count > 0 && (
              <>
                {issuesLoader.sub_issues.includes(issue?.id) ? (
                  <div className="w-full h-full flex justify-center items-center rounded-sm bg-custom-background-80 transition-all cursor-not-allowed">
                    <Loader width={14} strokeWidth={2} className="animate-spin" />
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex justify-center items-center rounded-sm hover:bg-custom-background-80 transition-all cursor-pointer"
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

          <div className="w-full flex items-center gap-2 cursor-pointer" onClick={() => openPeekOverview(issue?.id)}>
            <div
              className="flex-shrink-0 w-[6px] h-[6px] rounded-full"
              style={{
                backgroundColor: issue.state_detail.color,
              }}
            />
            <div className="flex-shrink-0 text-xs text-custom-text-200">
              {issue.project_detail.identifier}-{issue?.sequence_id}
            </div>
            <Tooltip tooltipHeading="Title" tooltipContent={`${issue?.name}`}>
              <div className="line-clamp-1 text-xs text-custom-text-100 pr-2">{issue?.name}</div>
            </Tooltip>
          </div>

          <div className="flex-shrink-0 text-sm">
            <IssueProperty
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssue={parentIssue}
              issue={issue}
              user={user}
              editable={editable}
            />
          </div>

          <div className="flex-shrink-0 text-sm">
            <CustomMenu width="auto" ellipsis>
              {editable && (
                <CustomMenu.MenuItem onClick={() => handleIssueCrudOperation("edit", parentIssue?.id, issue)}>
                  <div className="flex items-center justify-start gap-2">
                    <Pencil width={14} strokeWidth={2} />
                    <span>Edit issue</span>
                  </div>
                </CustomMenu.MenuItem>
              )}

              {editable && (
                <CustomMenu.MenuItem onClick={() => handleIssueCrudOperation("delete", parentIssue?.id, issue)}>
                  <div className="flex items-center justify-start gap-2">
                    <Trash width={14} strokeWidth={2} />
                    <span>Delete issue</span>
                  </div>
                </CustomMenu.MenuItem>
              )}

              <CustomMenu.MenuItem
                onClick={() => copyText(`${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`)}
              >
                <div className="flex items-center justify-start gap-2">
                  <LinkIcon width={14} strokeWidth={2} />
                  <span>Copy issue link</span>
                </div>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>

          {editable && (
            <>
              {issuesLoader.delete.includes(issue?.id) ? (
                <div className="flex-shrink-0 w-[22px] h-[22px] rounded-sm bg-red-200/10 text-red-500 transition-all cursor-not-allowed overflow-hidden flex justify-center items-center">
                  <Loader width={14} strokeWidth={2} className="animate-spin" />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 invisible group-hover:visible w-[22px] h-[22px] rounded-sm hover:bg-custom-background-80 transition-all cursor-pointer overflow-hidden flex justify-center items-center"
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
        />
      )}

      {peekIssue && peekIssue === issue?.id && (
        <IssuePeekOverview
          handleMutation={() => parentIssue && parentIssue?.id && mutate(SUB_ISSUES(parentIssue?.id))}
          projectId={issue?.project ?? ""}
          workspaceSlug={workspaceSlug ?? ""}
          readOnly={!editable}
        />
      )}
    </div>
  );
};
