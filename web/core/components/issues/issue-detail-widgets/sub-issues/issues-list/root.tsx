import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
import { GroupByColumnTypes, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
// hooks
import { Loader } from "@plane/ui";
import { getGroupByColumns, isWorkspaceLevel } from "@/components/issues/issue-layouts/utils";
import { useIssueDetail } from "@/hooks/store";

import { SubIssuesListGroup } from "./list-group";
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
  storeType: EIssuesStoreType;
};

export const SubIssuesListRoot: React.FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    disabled,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
    storeType = EIssuesStoreType.PROJECT,
    spacingLeft = 0,
  } = props;
  // store hooks
  const {
    subIssues: {
      loader,
      getGroupedSubIssuesByIssueId,
      filters: { getSubIssueFilters },
    },
  } = useIssueDetail(issueServiceType);

  if (loader === "init-loader") {
    return (
      <Loader className="flex flex-col gap-2 pt-3 pl-3">
        {[...Array(4)].map((_, index) => (
          <Loader.Item key={index} width="100%" height="35px" />
        ))}
      </Loader>
    );
  }

  // derived values
  const groupedSubIssues = getGroupedSubIssuesByIssueId(parentIssueId);
  const filters = getSubIssueFilters(parentIssueId);
  const group_by = filters?.displayFilters?.group_by ?? null;

  const groups = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: issueServiceType === EIssueServiceType.EPICS,
    projectId,
  });

  return (
    <div className="relative">
      {groups?.map((group) => (
        <SubIssuesListGroup
          key={group.id}
          workItemIds={groupedSubIssues?.[group.id] ?? []}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          group={group}
          serviceType={issueServiceType}
          disabled={disabled}
          parentIssueId={parentIssueId}
          handleIssueCrudState={handleIssueCrudState}
          subIssueOperations={subIssueOperations}
          storeType={storeType}
          spacingLeft={spacingLeft}
        />
      ))}
    </div>
  );
});
