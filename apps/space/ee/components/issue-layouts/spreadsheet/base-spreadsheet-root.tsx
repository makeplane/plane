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

export const BaseSpreadsheetRoot = observer(function BaseSpreadsheetRoot(props: Props) {
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
