import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { ListFilter } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { GroupByColumnTypes, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// hooks
import { SectionEmptyState } from "@/components/empty-state/section-empty-state-root";
import { getGroupByColumns, isWorkspaceLevel } from "@/components/issues/issue-layouts/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

import { SubIssuesListGroup } from "./list-group";
type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  canEdit: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueServiceType?: TIssueServiceType;
  storeType: EIssuesStoreType;
};

export const SubIssuesListRoot = observer(function SubIssuesListRoot(props: Props) {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    canEdit,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
    storeType = EIssuesStoreType.PROJECT,
    spacingLeft = 0,
  } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    subIssues: {
      subIssuesByIssueId,
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

  return (
    <div className="relative">
      {isRootLevel && filteredSubWorkItemsCount === 0 ? (
        <SectionEmptyState
          title={
            !isSubWorkItems
              ? t("sub_work_item.empty_state.list_filters.title")
              : t("sub_work_item.empty_state.sub_list_filters.title")
          }
          description={
            !isSubWorkItems
              ? t("sub_work_item.empty_state.list_filters.description")
              : t("sub_work_item.empty_state.sub_list_filters.description")
          }
          icon={<ListFilter />}
          customClassName={storeType !== EIssuesStoreType.EPIC ? "border-none" : ""}
          actionElement={
            <Button variant="secondary" onClick={() => resetFilters(rootIssueId)}>
              {t("sub_work_item.empty_state.list_filters.action")}
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
            canEdit={canEdit}
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
