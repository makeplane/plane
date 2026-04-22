/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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
import type { IIssue } from "@/types/issue";
// local components
import type { ChartDataType } from "../../gantt-chart";
import { GanttChartRoot, IssueGanttSidebar } from "../../gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "../../gantt-chart/views";
import { IssueGanttBlock } from "./blocks";

interface IBaseGanttRoot {
  anchor: string;
}

export const BaseGanttRoot = observer(function BaseGanttRoot(props: IBaseGanttRoot) {
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
  const viewIssuesKey =
    anchor && viewData ? ["PUBLIC_ISSUES", anchor, viewData.updated_at, displayFilters?.layout, orderBy] : null;

  const issueIds = groupedIssueIds?.[ALL_ISSUES] ?? [];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  useSWR(
    viewIssuesKey,
    anchor
      ? () =>
          fetchPublicIssues(anchor, "init-loader", {
            orderBy: orderBy,
            canGroup: false,
            perPageCount: 100,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  const loadMoreIssues = useCallback(() => {
    if (getIssueLoader() !== "pagination") {
      fetchNextPublicIssues(anchor);
    }
  }, [getIssueLoader, fetchNextPublicIssues, anchor]);

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType) => {
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

  if (!Array.isArray(issueIds)) return null;

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div className="size-full">
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
