import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType } from "@plane/constants";
import { TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store";
// local imports
import { SubIssuesListItem } from "./list-item";

type Props = {
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
};

export const SubIssuesListRoot: React.FC<Props> = observer((props) => {
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
  // store hooks
  const {
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const subIssueIds = subIssuesByIssueId(parentIssueId);

  return (
    <div className="relative">
      {subIssueIds?.map((issueId) => (
        <SubIssuesListItem
          key={issueId}
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
      ))}
    </div>
  );
});
