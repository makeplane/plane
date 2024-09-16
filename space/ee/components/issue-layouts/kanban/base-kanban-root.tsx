"use client";

import { useCallback, useRef } from "react";
import debounce from "lodash/debounce";
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
export const BaseKanBanRoot: React.FC<Props> = observer((props: Props) => {
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

  useSWR(
    anchor ? `PUBLIC_ISSUES_${anchor}` : null,
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
    { revalidateIfStale: false, revalidateOnFocus: false }
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
        className={`horizontal-scrollbar scrollbar-lg relative flex h-full w-full bg-custom-background-90 ${subGroupBy ? "vertical-scrollbar overflow-y-auto" : "overflow-x-auto overflow-y-hidden"}`}
        ref={scrollableContainerRef}
      >
        <div className="relative h-full w-max min-w-full bg-custom-background-90">
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
