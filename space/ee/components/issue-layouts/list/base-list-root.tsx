import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { TGroupedIssues } from "@plane/types";
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
import { List } from "@/components/issues/issue-layouts/list/default";
// hooks
import { useView } from "@/plane-web/hooks/store/use-published-view";
import { useViewIssues } from "@/plane-web/hooks/store/use-view-issues";

type Props = {
  anchor: string;
};

export const BaseListRoot = observer((props: Props) => {
  const { anchor } = props;
  // store hooks
  const {
    groupedIssueIds: storeGroupedIssueIds,
    fetchPublicIssues,
    fetchNextPublicIssues,
    getIssueLoader,
    getGroupIssueCount,
    getPaginationData,
  } = useViewIssues();

  const { viewData } = useView();

  const displayFilters = viewData?.display_filters;
  const displayProperties = viewData?.display_properties;

  const groupBy = displayFilters?.group_by;

  const orderBy = displayFilters?.order_by;

  const groupedIssueIds = storeGroupedIssueIds as TGroupedIssues | undefined;

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextPublicIssues(anchor, groupId);
    },
    [fetchNextPublicIssues]
  );

  useSWR(
    anchor ? `PUBLIC_ISSUES_${anchor}` : null,
    anchor
      ? () =>
          fetchPublicIssues(anchor, "init-loader", {
            groupedBy: groupBy,
            subGroupedBy: null,
            orderBy: orderBy,
            canGroup: true,
            perPageCount: 50,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div className={`relative size-full bg-custom-background-90`}>
        <List
          displayProperties={displayProperties}
          groupBy={groupBy}
          groupedIssueIds={groupedIssueIds ?? {}}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={displayFilters?.show_empty_groups ?? true}
          getIssueLoader={getIssueLoader}
          getGroupIssueCount={getGroupIssueCount}
          getPaginationData={getPaginationData}
        />
      </div>
    </IssueLayoutHOC>
  );
});
