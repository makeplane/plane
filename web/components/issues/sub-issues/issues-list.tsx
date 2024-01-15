import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueListItem } from "./issue-list-item";
// types
import { TIssue } from "@plane/types";
import { TSubIssueOperations } from "./root";
import useSWR from "swr";

export interface IIssueList {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  spacingLeft: number;
  disabled: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
}

export const IssueList: FC<IIssueList> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    spacingLeft = 10,
    disabled,
    handleIssueCrudState,
    subIssueOperations,
  } = props;
  // hooks
  const {
    subIssues: { subIssuesByIssueId, subIssueHelpersByIssueId },
  } = useIssueDetail();

  useSWR(
    workspaceSlug && projectId && parentIssueId
      ? `ISSUE_DETAIL_SUB_ISSUES_${workspaceSlug}_${projectId}_${parentIssueId}`
      : null,
    async () => {
      workspaceSlug &&
        projectId &&
        parentIssueId &&
        (await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, parentIssueId));
    }
  );

  const subIssueIds = subIssuesByIssueId(parentIssueId);
  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);

  return (
    <>
      {subIssueHelpers.preview_loader.includes(parentIssueId) ? "Loading..." : "Hello"}

      <div className="relative">
        {subIssueIds &&
          subIssueIds.length > 0 &&
          subIssueIds.map((issueId) => (
            <>
              <IssueListItem
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                parentIssueId={parentIssueId}
                spacingLeft={spacingLeft}
                disabled={disabled}
                handleIssueCrudState={handleIssueCrudState}
                subIssueOperations={subIssueOperations}
                issueId={issueId}
              />
            </>
          ))}

        <div
          className={`absolute bottom-0 top-0  ${spacingLeft > 10 ? `border-l border-custom-border-100` : ``}`}
          style={{ left: `${spacingLeft - 12}px` }}
        />
      </div>
    </>
  );
});
