import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TIssue } from "@plane/types";
// components
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { IssueParentSiblingItem } from "./sibling-item";

export type TIssueParentSiblings = {
  workspaceSlug: string;
  currentIssue: TIssue;
  parentIssue: TIssue;
};

export const IssueParentSiblings: FC<TIssueParentSiblings> = observer((props) => {
  const { workspaceSlug, currentIssue, parentIssue } = props;
  // hooks
  const {
    fetchSubIssues,
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  const { isLoading } = useSWR(
    parentIssue && parentIssue.project_id
      ? `ISSUE_PARENT_CHILD_ISSUES_${workspaceSlug}_${parentIssue.project_id}_${parentIssue.id}`
      : null,
    parentIssue && parentIssue.project_id
      ? () => fetchSubIssues(workspaceSlug, parentIssue.project_id!, parentIssue.id)
      : null
  );

  const subIssueIds = (parentIssue && subIssuesByIssueId(parentIssue.id)) || undefined;

  return (
    <div className="my-1">
      {isLoading ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 text-left text-xs text-custom-text-200">
          Loading
        </div>
      ) : subIssueIds && subIssueIds.length > 0 ? (
        subIssueIds.map(
          (issueId) =>
            currentIssue.id != issueId && (
              <IssueParentSiblingItem key={issueId} workspaceSlug={workspaceSlug} issueId={issueId} />
            )
        )
      ) : (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 text-left text-xs text-custom-text-200">
          No sibling issues
        </div>
      )}
    </div>
  );
});
