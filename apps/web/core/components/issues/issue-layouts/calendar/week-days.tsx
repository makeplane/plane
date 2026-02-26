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

import { observer } from "mobx-react";
// plane imports
import type { TGroupedIssues, TIssue, TPaginationData, ICalendarDate, ICalendarWeek } from "@plane/types";
import { cn, getOrderedDays, renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// types
import type { ICycleIssuesFilter } from "@/store/work-items/cycle";
import type { IModuleIssuesFilter } from "@/store/work-items/module";
import type { IProjectIssuesFilter } from "@/store/work-items/project";
import type { IProjectViewIssuesFilter } from "@/store/work-items/project-views";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarDayTile } from "./day-tile";
import type { IWorkspaceIssuesFilter } from "@/store/work-items/workspace";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IWorkspaceIssuesFilter;
  getWorkItemById: (workItemId: string) => TIssue | undefined;
  groupedIssueIds: TGroupedIssues;
  week: ICalendarWeek | undefined;
  quickActions: TRenderQuickActions;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
};

export const CalendarWeekDays = observer(function CalendarWeekDays(props: Props) {
  const {
    issuesFilterStore,
    getWorkItemById,
    groupedIssueIds,
    handleDragAndDrop,
    week,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    quickActions,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    readOnly = false,
    selectedDate,
    setSelectedDate,
    canEditProperties,
    isEpic = false,
  } = props;
  // hooks
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const showWeekends = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

  if (!week) return null;

  const shouldShowDay = (dayDate: Date) => {
    if (showWeekends) return true;
    const day = dayDate.getDay();
    return !(day === 0 || day === 6);
  };

  const sortedWeekDays = getOrderedDays(Object.values(week), (item) => item.date.getDay(), startOfWeek);

  return (
    <div
      className={cn("grid divide-subtle-1 md:divide-x-[0.5px]", {
        "grid-cols-7": showWeekends,
        "grid-cols-5": !showWeekends,
        "h-full": calendarLayout !== "month",
      })}
    >
      {sortedWeekDays.map((date: ICalendarDate) => {
        if (!shouldShowDay(date.date)) return null;

        return (
          <CalendarDayTile
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            issuesFilterStore={issuesFilterStore}
            key={renderFormattedPayloadDate(date.date)}
            date={date}
            getWorkItemById={getWorkItemById}
            groupedIssueIds={groupedIssueIds}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            quickActions={quickActions}
            enableQuickIssueCreate={enableQuickIssueCreate}
            disableIssueCreation={disableIssueCreation}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            handleDragAndDrop={handleDragAndDrop}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
          />
        );
      })}
    </div>
  );
});
