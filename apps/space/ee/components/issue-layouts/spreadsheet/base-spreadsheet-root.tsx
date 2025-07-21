import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane
import { ALL_ISSUES } from "@plane/constants";
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
// hooks
import { useView } from "@/plane-web/hooks/store/use-published-view";
import { useViewIssues } from "@/plane-web/hooks/store/use-view-issues";

import { SpreadsheetView } from "./spreadsheet-view";

type Props = {
  anchor: string;
};

export const BaseSpreadsheetRoot = observer((props: Props) => {
  const { anchor } = props;
  const {
    groupedIssueIds,
    getPaginationData,
    getIssueLoader,
    getGroupIssueCount,
    fetchNextPublicIssues,
    fetchPublicIssues,
  } = useViewIssues();

  const { viewData } = useView();

  const displayFilters = viewData?.display_filters;
  const displayProperties = viewData?.display_properties;
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

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <SpreadsheetView
        displayProperties={displayProperties ?? {}}
        issueIds={issueIds}
        canLoadMoreIssues={!!nextPageResults}
        loadMoreIssues={loadMoreIssues}
      />
    </IssueLayoutHOC>
  );
});
