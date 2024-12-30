import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssue, TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueListItem } from "./issue-list-item";
// types
import { TSubIssueOperations } from "./root";

export interface IIssueList {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  disabled: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueServiceType?: TIssueServiceType;
}

export const IssueList: FC<IIssueList> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    spacingLeft = 10,
    disabled,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // hooks
  const {
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail(issueServiceType);

  const subIssueIds = subIssuesByIssueId(parentIssueId);

  return (
    <div className="relative">
      {subIssueIds &&
        subIssueIds.length > 0 &&
        subIssueIds.map((issueId) => (
          <Fragment key={issueId}>
            <IssueListItem
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssueId={parentIssueId}
              rootIssueId={rootIssueId}
              issueId={issueId}
              spacingLeft={spacingLeft}
              disabled={disabled}
              handleIssueCrudState={handleIssueCrudState}
              subIssueOperations={subIssueOperations}
              issueServiceType={issueServiceType}
            />
          </Fragment>
        ))}
    </div>
  );
});
