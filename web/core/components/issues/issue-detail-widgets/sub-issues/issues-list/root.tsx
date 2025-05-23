import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { ListFilter } from "lucide-react";
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
import { GroupByColumnTypes, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
// hooks
import { Button, Loader } from "@plane/ui";
import { SectionEmptyState } from "@/components/empty-state";
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
      subIssuesByIssueId, loader,
      filters: { getSubIssueFilters, getGroupedSubWorkItems, getFilteredSubWorkItems, resetFilters },
    },
  } = useIssueDetail(issueServiceType);

  // derived values
  const filters = getSubIssueFilters(rootIssueId);
  const isRootLevel = useMemo(() => rootIssueId === parentIssueId, [rootIssueId, parentIssueId]);
  const group_by = isRootLevel ? (filters?.displayFilters?.group_by ?? null) : null;
  const filteredSubWorkItemsCount = (getFilteredSubWorkItems(rootIssueId, filters.filters ?? {}) ?? []).length;

  const groups = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: issueServiceType === EIssueServiceType.EPICS,
    projectId,
  });

  const getWorkItemIds = useCallback(
    (groupId: string) => {
      if (isRootLevel) {
        const groupedSubIssues = getGroupedSubWorkItems(rootIssueId);
        return groupedSubIssues?.[groupId] ?? [];
      }
      const subIssueIds = subIssuesByIssueId(parentIssueId);
      return subIssueIds ?? [];
    },
    [isRootLevel, subIssuesByIssueId, rootIssueId, getGroupedSubWorkItems, parentIssueId]
  );

  const isSubWorkItems = issueServiceType === EIssueServiceType.ISSUES;

    if (loader === "init-loader") {
      return (
        <Loader className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Loader.Item key={index} height="35px" width="100%" />
          ))}
        </Loader>
      );
    }

  return (
    <div className="relative">
      {isRootLevel && filteredSubWorkItemsCount === 0 ? (
        <SectionEmptyState
          title={
            !isSubWorkItems
              ? "You don't have work items that match the filters you've applied."
              : "You don't have sub-work items that match the filters you've applied."
          }
          description={
            !isSubWorkItems
              ? "To see all work items, clear all applied filters."
              : "To see all sub-work items, clear all applied filters."
          }
          icon={<ListFilter />}
          customClassName={storeType !== EIssuesStoreType.EPIC ? "border-none" : ""}
          actionElement={
            <Button variant="neutral-primary" size="sm" onClick={() => resetFilters(rootIssueId)}>
              Clear filters
            </Button>
          }
        />
      ) : (
        groups?.map((group) => (
          <SubIssuesListGroup
            key={group.id}
            workItemIds={getWorkItemIds(group.id)}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            group={group}
            serviceType={issueServiceType}
            disabled={disabled}
            parentIssueId={parentIssueId}
            rootIssueId={rootIssueId}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
            storeType={storeType}
            spacingLeft={spacingLeft}
          />
        ))
      )}
    </div>
  );
});
