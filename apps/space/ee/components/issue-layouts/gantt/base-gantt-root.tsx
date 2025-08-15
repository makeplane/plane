import React, { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane constants
import { ALL_ISSUES } from "@plane/constants";
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
//hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// helpers
import { getIssueBlocksStructure } from "@/plane-web/helpers/gantt.helper";
// plane web hooks
import { useView, useViewIssues } from "@/plane-web/hooks/store";
import { IIssue } from "@/types/issue";
// local components
import { ChartDataType, GanttChartRoot, IssueGanttSidebar } from "../../gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "../../gantt-chart/views";
import { IssueGanttBlock } from "./blocks";

interface IBaseGanttRoot {
  anchor: string;
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { anchor } = props;
  // rstore
  const {
    groupedIssueIds,
    getPaginationData,
    getIssueLoader,
    getGroupIssueCount,
    fetchNextPublicIssues,
    fetchPublicIssues,
  } = useViewIssues();

  const { getIssueById } = useIssueDetails();

  const { viewData } = useView();

  const displayFilters = viewData?.display_filters;
  const orderBy = displayFilters?.order_by ?? "-created_at";

  const issueIds = groupedIssueIds?.[ALL_ISSUES] ?? [];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  useSWR(
    anchor ? `PUBLIC_ISSUES_${anchor}` : null,
    anchor
      ? () =>
          fetchPublicIssues(anchor, "init-loader", {
            orderBy: orderBy,
            canGroup: false,
            perPageCount: 100,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const loadMoreIssues = useCallback(() => {
    if (getIssueLoader() !== "pagination") {
      fetchNextPublicIssues(anchor);
    }
  }, [fetchNextPublicIssues]);

  if (!Array.isArray(issueIds)) return null;

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const issue = getIssueById(id);

      if (!issue) return;

      const block = getIssueBlocksStructure(issue);
      if (currentViewData) {
        return {
          ...block,
          position: getMonthChartItemPositionWidthInMonth(currentViewData, block),
        };
      }
      return block;
    },
    [getIssueById]
  );

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div className="h-full w-full">
        <GanttChartRoot
          border={false}
          title="Work items"
          blockIds={issueIds}
          getBlockById={getBlockById}
          blockToRender={(data: IIssue) => <IssueGanttBlock issueId={data.id} />}
          sidebarToRender={(props) => <IssueGanttSidebar {...props} showAllBlocks getIssueLoader={getIssueLoader} />}
          loadMoreBlocks={loadMoreIssues}
          canLoadMoreBlocks={nextPageResults}
          showAllBlocks
        />
      </div>
    </IssueLayoutHOC>
  );
});
