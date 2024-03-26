import { FC } from "react";
import useSWR from "swr";
import { TIssue } from "@plane/types";
// components
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { IssueParentSiblingItem } from "./sibling-item";

export type TIssueParentSiblings = {
  currentIssue: TIssue;
  parentIssue: TIssue;
};

export const IssueParentSiblings: FC<TIssueParentSiblings> = (props) => {
  const { currentIssue, parentIssue } = props;
  // hooks
  const {
    peekIssue,
    fetchSubIssues,
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  const { isLoading } = useSWR(
    peekIssue && parentIssue && parentIssue.project_id
      ? `ISSUE_PARENT_CHILD_ISSUES_${peekIssue?.workspaceSlug}_${parentIssue.project_id}_${parentIssue.id}`
      : null,
    peekIssue && parentIssue && parentIssue.project_id
      ? () => fetchSubIssues(peekIssue?.workspaceSlug, parentIssue.project_id, parentIssue.id)
      : null
  );

  const subIssueIds = (parentIssue && subIssuesByIssueId(parentIssue.id)) || undefined;

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 text-left text-xs text-custom-text-200">
          Loading
        </div>
      ) : subIssueIds && subIssueIds.length > 0 ? (
        subIssueIds.map(
          (issueId) => currentIssue.id != issueId && <IssueParentSiblingItem key={issueId} issueId={issueId} />
        )
      ) : (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 text-left text-xs text-custom-text-200">
          No sibling issues
        </div>
      )}
    </div>
  );
};
