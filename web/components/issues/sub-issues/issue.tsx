import React from "react";
// next imports
import Link from "next/link";
// lucide icons
import {
  ChevronDown,
  ChevronRight,
  X,
  Pencil,
  Trash,
  Link as LinkIcon,
  Loader,
} from "lucide-react";
// components
import { SubIssuesRootList } from "./issues-list";
import { IssueProperty } from "./properties";
// ui
import { Tooltip, CustomMenu } from "components/ui";

// types
import { ICurrentUserResponse, IIssue } from "types";

export interface ISubIssues {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
  issue: any;
  spacingLeft?: number;
  user: ICurrentUserResponse | undefined;
  editable: boolean;
  removeIssueFromSubIssues: (parentIssueId: string, issue: IIssue) => void;
  issuesVisibility: string[];
  handleIssuesVisibility: (issueId: string) => void;
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
  issuesVisibility,
  handleIssuesVisibility,
  copyText,
  handleIssueCrudOperation,
}) => (
  <div>
    {issue && (
      <div
        className="relative flex items-center gap-2 py-1 px-2 w-full h-full hover:bg-custom-background-90 group transition-all border-b border-custom-border-100"
        style={{ paddingLeft: `${spacingLeft}px` }}
      >
        <div className="flex-shrink-0 w-[22px] h-[22px]">
          {issue?.sub_issues_count > 0 && (
            <>
              {true ? (
                <div
                  className="w-full h-full flex justify-center items-center rounded-sm hover:bg-custom-background-80 transition-all cursor-pointer"
                  onClick={() => handleIssuesVisibility(issue?.id)}
                >
                  {issuesVisibility && issuesVisibility.includes(issue?.id) ? (
                    <ChevronDown width={14} strokeWidth={2} />
                  ) : (
                    <ChevronRight width={14} strokeWidth={2} />
                  )}
                </div>
              ) : (
                <Loader width={14} strokeWidth={2} className="animate-spin" />
              )}
            </>
          )}
        </div>

        <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
          <a className="w-full flex items-center gap-2">
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
              <div className="line-clamp-1 text-xs text-custom-text-100">{issue?.name}</div>
            </Tooltip>
          </a>
        </Link>

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
              <CustomMenu.MenuItem
                onClick={() => handleIssueCrudOperation("edit", parentIssue?.id, issue)}
              >
                <div className="flex items-center justify-start gap-2">
                  <Pencil width={14} strokeWidth={2} />
                  <span>Edit issue</span>
                </div>
              </CustomMenu.MenuItem>
            )}

            {editable && (
              <CustomMenu.MenuItem
                onClick={() => handleIssueCrudOperation("delete", parentIssue?.id, issue)}
              >
                <div className="flex items-center justify-start gap-2">
                  <Trash width={14} strokeWidth={2} />
                  <span>Delete issue</span>
                </div>
              </CustomMenu.MenuItem>
            )}

            <CustomMenu.MenuItem onClick={copyText}>
              <div className="flex items-center justify-start gap-2">
                <LinkIcon width={14} strokeWidth={2} />
                <span>Copy issue link</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>

        {editable && (
          <div
            className="flex-shrink-0 invisible group-hover:visible w-[22px] h-[22px] flex justify-center items-center rounded-sm hover:bg-custom-background-80 transition-all cursor-pointer overflow-hidden"
            onClick={() => removeIssueFromSubIssues(parentIssue?.id, issue)}
          >
            <X width={14} strokeWidth={2} />
          </div>
        )}
      </div>
    )}

    {issuesVisibility.includes(issue?.id) && issue?.sub_issues_count > 0 && (
      <SubIssuesRootList
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssue={issue}
        spacingLeft={spacingLeft + 22}
        user={user}
        editable={editable}
        removeIssueFromSubIssues={removeIssueFromSubIssues}
        issuesVisibility={issuesVisibility}
        handleIssuesVisibility={handleIssuesVisibility}
        copyText={copyText}
        handleIssueCrudOperation={handleIssueCrudOperation}
      />
    )}
  </div>
);
