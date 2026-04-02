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

import { useCallback, useRef } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
//components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
import { KanBan } from "@/components/issues/issue-layouts/kanban/default";
import { KanBanSwimLanes } from "@/components/issues/issue-layouts/kanban/swimlanes";
//hooks
import { useView } from "@/plane-web/hooks/store/use-published-view";
import { useViewIssues } from "@/plane-web/hooks/store/use-view-issues";

type Props = {
  anchor: string;
};
export const BaseKanBanRoot = observer(function BaseKanBanRoot(props: Props) {
  const { anchor } = props;
  // store hooks
  const {
    groupedIssueIds,
    getIssueLoader,
    getGroupIssueCount,
    getPaginationData,
    fetchPublicIssues,
    fetchNextPublicIssues,
  } = useViewIssues();
  const { viewData } = useView();

  const displayFilters = viewData?.display_filters;
  const displayProperties = viewData?.display_properties;

  const subGroupBy = displayFilters?.sub_group_by;
  const groupBy = displayFilters?.group_by;

  const orderBy = displayFilters?.order_by;
  const viewIssuesKey =
    anchor && viewData
      ? ["PUBLIC_ISSUES", anchor, viewData.updated_at, displayFilters?.layout, groupBy, subGroupBy, orderBy]
      : null;

  useSWR(
    viewIssuesKey,
    anchor
      ? () =>
          fetchPublicIssues(anchor, "init-loader", {
            groupedBy: groupBy,
            subGroupedBy: subGroupBy,
            orderBy: orderBy,
            canGroup: true,
            perPageCount: subGroupBy ? 10 : 30,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  const fetchMoreIssues = useCallback(
    (groupId?: string, subgroupId?: string) => {
      if (getIssueLoader(groupId, subgroupId) !== "pagination") {
        fetchNextPublicIssues(anchor, groupId, subgroupId);
      }
    },
    [fetchNextPublicIssues]
  );

  const debouncedFetchMoreIssues = debounce(
    (groupId?: string, subgroupId?: string) => fetchMoreIssues(groupId, subgroupId),
    300,
    { leading: true, trailing: false }
  );

  const KanBanView = subGroupBy ? KanBanSwimLanes : KanBan;

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div
        className={`horizontal-scrollbar scrollbar-lg relative flex h-full w-full ${subGroupBy ? "vertical-scrollbar overflow-y-auto" : "overflow-x-auto overflow-y-hidden"}`}
        ref={scrollableContainerRef}
      >
        <div className="relative h-full w-max min-w-full">
          <div className="h-full w-max">
            <KanBanView
              groupedIssueIds={groupedIssueIds ?? {}}
              displayProperties={displayProperties}
              subGroupBy={subGroupBy}
              groupBy={groupBy}
              orderBy={orderBy}
              showEmptyGroup={displayFilters?.show_empty_groups ?? true}
              scrollableContainerRef={scrollableContainerRef}
              loadMoreIssues={debouncedFetchMoreIssues}
              getGroupIssueCount={getGroupIssueCount}
              getPaginationData={getPaginationData}
              getIssueLoader={getIssueLoader}
            />
          </div>
        </div>
      </div>
    </IssueLayoutHOC>
  );
});
