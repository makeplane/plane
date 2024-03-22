import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ChartDataType, GanttChartRoot, IBlockUpdateData, IssueGanttSidebar } from "components/gantt-chart";
import { GanttQuickAddIssueForm, IssueGanttBlock } from "components/issues";
import { EUserProjectRoles } from "constants/project";
import { getIssueBlocksStructure } from "helpers/issue.helper";
import { useIssues, useUser } from "hooks/store";
import { useIssuesActions } from "hooks/use-issues-actions";
// components
// helpers
// types
import { TIssue } from "@plane/types";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import useSWR from "swr";
import { getMonthChartItemPositionWidthInMonth } from "components/gantt-chart/views";
import { ALL_ISSUES } from "store/issue/helpers/base-issues.store";

type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;
interface IBaseGanttRoot {
  viewId?: string;
  storeType: GanttStoreType;
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { viewId, storeType } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const { fetchIssues, fetchNextIssues, updateIssue } = useIssuesActions(storeType);
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;

  useSWR(`ISSUE_GANTT_LAYOUT_${storeType}`, () => fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

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

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <IssueLayoutHOC storeType={storeType} layout={EIssueLayoutTypes.GANTT}>
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
          quickAdd={
            enableIssueCreation && isAllowed ? (
              <GanttQuickAddIssueForm quickAddCallback={issues.quickAddIssue} viewId={viewId} />
            ) : undefined
          }
          loadMoreBlocks={loadMoreIssues}
          canLoadMoreBlocks={nextPageResults}
          showAllBlocks
        />
      </div>
    </IssueLayoutHOC>
  );
});
