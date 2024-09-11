import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { ALL_ISSUES } from "@plane/constants";
import { TIssue } from "@plane/types";
// hooks
import { ChartDataType, GanttChartRoot, IBlockUpdateData, IssueGanttSidebar } from "@/components/gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "@/components/gantt-chart/views";
import { QuickAddIssueRoot, IssueGanttBlock, GanttQuickAddIssueButton } from "@/components/issues";
//constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getIssueBlocksStructure } from "@/helpers/issue.helper";
//hooks
import { useIssues, useUserPermissions } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// plane web hooks
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";

import { IssueLayoutHOC } from "../issue-layout-HOC";

interface IBaseGanttRoot {
  viewId?: string | undefined;
  isCompletedCycle?: boolean;
}

export type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { viewId, isCompletedCycle = false } = props;
  // router
  const { workspaceSlug } = useParams();

  const storeType = useIssueStoreType() as GanttStoreType;
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const { fetchIssues, fetchNextIssues, updateIssue, quickAddIssue } = useIssuesActions(storeType);
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();
  // derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, viewId);
  }, [fetchIssues, storeType, viewId]);

  const issuesIds = (issues.groupedIssueIds?.[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = issues.getPaginationData(undefined, undefined)?.nextPageResults;

  const { enableIssueCreation } = issues?.viewFlags || {};

  const loadMoreIssues = useCallback(() => {
    fetchNextIssues();
  }, [fetchNextIssues]);

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const issue = issueMap[id];
      const block = getIssueBlocksStructure(issue);
      if (currentViewData) {
        return {
          ...block,
          position: getMonthChartItemPositionWidthInMonth(currentViewData, block),
        };
      }
      return block;
    },
    [issueMap]
  );

  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    updateIssue && (await updateIssue(issue.project_id, issue.id, payload));
  };

  const isAllowed = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  const quickAdd =
    enableIssueCreation && isAllowed && !isCompletedCycle ? (
      <QuickAddIssueRoot
        layout={EIssueLayoutTypes.GANTT}
        QuickAddButton={GanttQuickAddIssueButton}
        containerClassName="sticky bottom-0 z-[1]"
        prePopulatedData={{
          start_date: renderFormattedPayloadDate(new Date()),
          target_date: renderFormattedPayloadDate(targetDate),
        }}
        quickAddCallback={quickAddIssue}
      />
    ) : undefined;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <div className="h-full w-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blockIds={issuesIds}
          getBlockById={getBlockById}
          blockUpdateHandler={updateIssueBlockStructure}
          blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} />}
          sidebarToRender={(props) => <IssueGanttSidebar {...props} showAllBlocks />}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters?.order_by === "sort_order" && isAllowed}
          enableAddBlock={isAllowed}
          enableSelection={isBulkOperationsEnabled && isAllowed}
          quickAdd={quickAdd}
          loadMoreBlocks={loadMoreIssues}
          canLoadMoreBlocks={nextPageResults}
          showAllBlocks
        />
      </div>
    </IssueLayoutHOC>
  );
});
