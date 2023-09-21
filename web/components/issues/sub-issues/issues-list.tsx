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
}

export const SubIssuesRootList: React.FC<ISubIssuesRootList> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  spacingLeft = 0,
  user,
  editable,
  removeIssueFromSubIssues,
  issuesVisibility,
  handleIssuesVisibility,
  copyText,
}) => {
  const { data: issues, isLoading } = useSWR(
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? SUB_ISSUES(parentIssue?.id)
      : null,
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? () => issuesService.subIssues(workspaceSlug, projectId, parentIssue.id)
      : null
  );

  console.log("isLoading", isLoading);

  return (
    <>
      {issues &&
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
          />
        ))}
    </>
  );
};
