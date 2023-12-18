import { useEffect } from "react";
import useSWR from "swr";
// components
import { SubIssues } from "./issue";
// types
import { IUser, IIssue } from "types";
import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";
// services
import { IssueService } from "services/issue";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface ISubIssuesRootList {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
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

const issueService = new IssueService();

export const SubIssuesRootList: React.FC<ISubIssuesRootList> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  spacingLeft = 10,
  user,
  editable,
  removeIssueFromSubIssues,
  issuesLoader,
  handleIssuesLoader,
  copyText,
  handleIssueCrudOperation,
  handleUpdateIssue,
}) => {
  const { data: issues, isLoading } = useSWR(
    workspaceSlug && projectId && parentIssue && parentIssue?.id ? SUB_ISSUES(parentIssue?.id) : null,
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? () => issueService.subIssues(workspaceSlug, projectId, parentIssue.id)
      : null
  );

  useEffect(() => {
    if (isLoading) {
      handleIssuesLoader({ key: "sub_issues", issueId: parentIssue?.id });
    } else {
      if (issuesLoader.sub_issues.includes(parentIssue?.id)) {
        handleIssuesLoader({ key: "sub_issues", issueId: parentIssue?.id });
      }
    }
  }, [handleIssuesLoader, isLoading, issuesLoader.sub_issues, parentIssue?.id]);

  return (
    <>
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
              issuesLoader={issuesLoader}
              handleIssuesLoader={handleIssuesLoader}
              copyText={copyText}
              handleIssueCrudOperation={handleIssueCrudOperation}
              handleUpdateIssue={handleUpdateIssue}
            />
          ))}

        <div
          className={`absolute bottom-0 top-0  ${spacingLeft > 10 ? `border-l border-custom-border-100` : ``}`}
          style={{ left: `${spacingLeft - 12}px` }}
        />
      </div>
    </>
  );
};
