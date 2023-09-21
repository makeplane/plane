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
import { CustomMenu } from "components/ui";
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
}) => (
  <div>
    {issue && (
      <div
        className="relative flex items-center px-2 gap-2 hover:bg-custom-background-90 group transition-all border-b border-custom-border-100 py-1"
        style={{ paddingLeft: `${spacingLeft}px` }}
      >
        <div className="flex-shrink-0 w-[22px] h-[22px] border-l border-custom-border-100">
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

        <Link href={"/"}>
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
            <div className="line-clamp-1 text-xs font-medium text-custom-text-100">
              {issue?.name}
            </div>
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
            {/* {editable && (
              <CustomMenu.MenuItem onClick={() => editIssue()}>
                <div className="flex items-center justify-start gap-2">
                  <Pencil width={14} strokeWidth={2} />
                  <span>Edit issue</span>
                </div>
              </CustomMenu.MenuItem>
            )} */}

            {/* {editable && (
              <CustomMenu.MenuItem onClick={() => handleDeleteIssue(issue)}>
                <div className="flex items-center justify-start gap-2">
                  <Trash width={14} strokeWidth={2} />
                  <span>Delete issue</span>
                </div>
              </CustomMenu.MenuItem>
            )} */}

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
      />
    )}
  </div>
);
