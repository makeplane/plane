import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueListItem } from "./issue-list-item";
// types
import { TIssue } from "@plane/types";
import { TSubIssueOperations } from "./root";

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
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  const subIssueIds = subIssuesByIssueId(parentIssueId);

  return (
    <>
      <div className="relative">
        {subIssueIds &&
          subIssueIds.length > 0 &&
          subIssueIds.map((issueId) => (
            <>
              <IssueListItem
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                parentIssueId={parentIssueId}
                issueId={issueId}
                spacingLeft={spacingLeft}
                disabled={disabled}
                handleIssueCrudState={handleIssueCrudState}
                subIssueOperations={subIssueOperations}
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
