import { useMemo } from "react";
// components
import { SubIssues } from "./issue";
// types
import { IUser, TIssue } from "@plane/types";
import { ISubIssuesRootLoaders, ISubIssuesRootLoadersHandler } from "./root";

// fetch keys
import { useIssueDetail } from "hooks/store";

export interface ISubIssuesRootList {
  workspaceSlug: string;
  projectId: string;
  parentIssue: TIssue;
  spacingLeft?: number;
  user: IUser | undefined;
  editable: boolean;
  removeIssueFromSubIssues: (parentIssueId: string, issue: TIssue) => void;
  issuesLoader: ISubIssuesRootLoaders;
  handleIssuesLoader: ({ key, issueId }: ISubIssuesRootLoadersHandler) => void;
  copyText: (text: string) => void;
  handleIssueCrudOperation: (
    key: "create" | "existing" | "edit" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  handleUpdateIssue: (issue: TIssue, data: Partial<TIssue>) => void;
}

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
  const issueDetail = useIssueDetail();
  issueDetail.subIssues.fetchSubIssues(workspaceSlug, projectId, parentIssue?.id);

  const subIssues = issueDetail.subIssues.subIssuesByIssueId(parentIssue?.id);

  const handleIssue = useMemo(
    () => ({
      fetchIssues: async (issueId: string) => issueDetail.subIssues.fetchSubIssues(workspaceSlug, projectId, issueId),
      updateIssue: async (issueId: string, data: Partial<TIssue>) =>
        issueDetail.updateIssue(workspaceSlug, projectId, issueId, data),
      removeIssue: (issueId: string) => issueDetail.removeIssue(workspaceSlug, projectId, issueId),
    }),
    [issueDetail, workspaceSlug, projectId]
  );

  return (
    <>
      <div className="relative">
        {subIssues &&
          subIssues.length > 0 &&
          subIssues.map((issueId: string) => (
            <SubIssues
              key={`${issueId}`}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssue={parentIssue}
              issueId={issueId}
              handleIssue={handleIssue}
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
