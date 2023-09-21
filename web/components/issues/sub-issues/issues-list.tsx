import React from "react";
// swr
import useSWR from "swr";
// components
import { SubIssues } from "./issue";
// types
import { ICurrentUserResponse, IIssue } from "types";
// services
import issuesService from "services/issues.service";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface ISubIssuesRootList {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
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

export const SubIssuesRootList: React.FC<ISubIssuesRootList> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  spacingLeft = 10,
  user,
  editable,
  removeIssueFromSubIssues,
  issuesVisibility,
  handleIssuesVisibility,
  copyText,
  handleIssueCrudOperation,
}) => {
  const { data: issues, isLoading } = useSWR(
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? SUB_ISSUES(parentIssue?.id)
      : null,
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? () => issuesService.subIssues(workspaceSlug, projectId, parentIssue.id)
      : null
  );

  return (
    <div className="relative">
      {issues &&
        issues.sub_issues &&
        issues.sub_issues.length > 0 &&
        issues.sub_issues.map((issue: IIssue) => (
          <SubIssues
            key={`${issue?.id}`}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            parentIssue={parentIssue}
            issue={issue}
            spacingLeft={spacingLeft}
            user={user}
            editable={editable}
            removeIssueFromSubIssues={removeIssueFromSubIssues}
            issuesVisibility={issuesVisibility}
            handleIssuesVisibility={handleIssuesVisibility}
            copyText={copyText}
            handleIssueCrudOperation={handleIssueCrudOperation}
          />
        ))}

      <div
        className={`absolute top-0 bottom-0  ${
          spacingLeft > 10 ? `border-l border-custom-border-100` : ``
        }`}
        style={{ left: `${spacingLeft - 12}px` }}
      />
    </div>
  );
};
