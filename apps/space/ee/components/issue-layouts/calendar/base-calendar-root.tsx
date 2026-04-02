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

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane
import { EIssueGroupByToServerOptions } from "@plane/constants";
import type { TGroupedIssues } from "@plane/types";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useCalendarView } from "@/plane-web/hooks/store";
import { useView } from "@/plane-web/hooks/store/use-published-view";
import { useViewIssues } from "@/plane-web/hooks/store/use-view-issues";
//
import { CalendarChart } from "./calendar";

interface IBaseCalendarRoot {
  anchor: string;
}

export const BaseCalendarRoot = observer(function BaseCalendarRoot(props: IBaseCalendarRoot) {
  const { anchor } = props;

  const { viewData } = useView();
  const issues = useViewIssues();
  const { getIssueById } = useIssueDetails();
  const issueCalendarView = useCalendarView();

  const displayFilters = viewData?.display_filters;

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const layout = displayFilters?.calendar?.layout ?? "month";
  const viewUpdatedAt = viewData?.updated_at;
  const { startDate, endDate } = issueCalendarView.getStartAndEndDate(layout) ?? {};

  useEffect(() => {
    startDate &&
      endDate &&
      layout &&
      issues.fetchPublicIssues(anchor, "init-loader", {
        canGroup: true,
        perPageCount: layout === "month" ? 4 : 30,
        before: endDate,
        after: startDate,
        groupedBy: EIssueGroupByToServerOptions["target_date"],
      });
  }, [issues, startDate, endDate, layout, anchor, viewUpdatedAt]);

  const loadMoreIssues = useCallback(
    (dateString: string) => {
      issues.fetchNextPublicIssues(anchor, dateString);
    },
    [anchor, issues]
  );

  const getPaginationData = useCallback(
    (groupId: string | undefined) => issues?.getPaginationData(groupId, undefined),
    [issues?.getPaginationData]
  );

  const getGroupIssueCount = useCallback(
    (groupId: string | undefined) => issues?.getGroupIssueCount(groupId, undefined, false),
    [issues?.getGroupIssueCount]
  );

  return (
    <>
      <div className="h-full w-full overflow-hidden pt-4">
        <CalendarChart
          getIssueById={getIssueById}
          groupedIssueIds={groupedIssueIds}
          calendarLayout={displayFilters?.calendar?.layout}
          showWeekends={displayFilters?.calendar?.show_weekends ?? false}
          issueCalendarView={issueCalendarView}
          loadMoreIssues={loadMoreIssues}
          getPaginationData={getPaginationData}
          getIssueLoader={issues.getIssueLoader}
          getGroupIssueCount={getGroupIssueCount}
        />
      </div>
    </>
  );
});
