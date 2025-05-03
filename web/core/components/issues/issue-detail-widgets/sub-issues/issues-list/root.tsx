import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
import { GroupByColumnTypes, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
// hooks
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
    rootIssueId,
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
      subIssuesByIssueId,
      filters: { getSubIssueFilters, getGroupedSubWorkItems },
    },
  } = useIssueDetail(issueServiceType);

  // derived values
  const filters = getSubIssueFilters(parentIssueId);
  const isRootLevel = useMemo(() => rootIssueId === parentIssueId, [rootIssueId, parentIssueId]);
  const group_by = isRootLevel ? (filters?.displayFilters?.group_by ?? null) : null;

  const groups = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: issueServiceType === EIssueServiceType.EPICS,
    projectId,
  });

  const workItemIds = useCallback(
    (groupId: string) => {
      if (isRootLevel) {
        const groupedSubIssues = getGroupedSubWorkItems(rootIssueId);
        return groupedSubIssues?.[groupId] ?? [];
      }
      return subIssuesByIssueId(parentIssueId) ?? [];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRootLevel, parentIssueId, rootIssueId, loader]
  );

  return (
    <div className="relative">
      {groups?.map((group) => (
        <SubIssuesListGroup
          key={group.id}
          workItemIds={workItemIds(group.id)}
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
