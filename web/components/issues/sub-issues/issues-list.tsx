import { useEffect } from "react";
// swr
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
            issuesLoader={issuesLoader}
            handleIssuesLoader={handleIssuesLoader}
            copyText={copyText}
            handleIssueCrudOperation={handleIssueCrudOperation}
          />
        ))}

      <div
        className={`absolute top-0 bottom-0  ${spacingLeft > 10 ? `border-l border-custom-border-100` : ``}`}
        style={{ left: `${spacingLeft - 12}px` }}
      />
    </div>
  );
};
