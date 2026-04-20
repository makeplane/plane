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

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { observer } from "mobx-react";
// plane imports
import { MONTHS_LIST } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TGroupedIssues, TIssue, TPaginationData, ICalendarDate } from "@plane/types";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// helpers
import { highlightOnDrop } from "@/helpers/common";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// components
// store
import type { ICycleIssuesFilter } from "@/store/work-items/cycle";
import type { IModuleIssuesFilter } from "@/store/work-items/module";
import type { IProjectIssuesFilter } from "@/store/work-items/project";
import type { IProjectViewIssuesFilter } from "@/store/work-items/project-views";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlocks } from "./issue-blocks";
import type { IWorkspaceIssuesFilter } from "@/store/work-items/workspace";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IWorkspaceIssuesFilter;
  date: ICalendarDate;
  getWorkItemById: (workItemId: string) => TIssue | undefined;
  groupedIssueIds: TGroupedIssues;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  quickActions: TRenderQuickActions;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  canQuickAddWorkItem: boolean;
  getWorkItemPermissions: (workItem: TIssue) => {
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canDragAndDrop: boolean;
  };
  isEpic?: boolean;
};

export const CalendarDayTile = observer(function CalendarDayTile(props: Props) {
  const {
    issuesFilterStore,
    date,
    getWorkItemById,
    groupedIssueIds,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    quickActions,
    canQuickAddWorkItem,
    quickAddCallback,
    addIssuesToView,
    selectedDate,
    handleDragAndDrop,
    setSelectedDate,
    getWorkItemPermissions,
    isEpic = false,
  } = props;

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const formattedDatePayload = renderFormattedPayloadDate(date.date);

  const dayTileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = dayTileRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ date: formattedDatePayload }),
        onDragEnter: () => {
          setIsDraggingOver(true);
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
        },
        onDrop: ({ source, self }) => {
          setIsDraggingOver(false);
          const sourceData = source?.data as { id: string; date: string } | undefined;
          const destinationData = self?.data as { date: string } | undefined;
          if (!sourceData || !destinationData) return;

          const issueDetails = getWorkItemById(sourceData?.id);
          if (issueDetails?.start_date) {
            const issueStartDate = new Date(issueDetails.start_date);
            const targetDate = new Date(destinationData?.date);
            const diffInDays = differenceInCalendarDays(targetDate, issueStartDate);
            if (diffInDays < 0) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Due date cannot be before the start date of the work item.",
              });
              return;
            }
          }

          handleDragAndDrop(
            sourceData?.id,
            issueDetails?.project_id ?? undefined,
            sourceData?.date,
            destinationData?.date
          );
          highlightOnDrop(source?.element?.id, false);
        },
      })
    );
  }, [formattedDatePayload]);

  if (!formattedDatePayload) return null;
  const issueIds = groupedIssueIds?.[formattedDatePayload];

  const isToday = date.date.toDateString() === new Date().toDateString();
  const isSelectedDate = date.date.toDateString() == selectedDate.toDateString();

  const isWeekend = [0, 6].includes(date.date.getDay());
  const isMonthLayout = calendarLayout === "month";

  const normalBackground = isWeekend ? "bg-layer-1" : "bg-layer-transparent";
  const draggingOverBackground = isWeekend ? "bg-layer-1" : "bg-layer-transparent-hover";

  return (
    <>
      <div ref={dayTileRef} className="group relative flex h-full w-full flex-col">
        {/* header */}
        <div
          className={`hidden flex-shrink-0 justify-end px-2 py-1.5 text-right text-11 md:flex ${
            isMonthLayout // if month layout, highlight current month days
              ? date.is_current_month
                ? "font-medium"
                : "text-tertiary"
              : "font-medium" // if week layout, highlight all days
          } ${isWeekend ? "bg-layer-1" : "bg-layer-transparent"} `}
        >
          {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
          {isToday ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-on-color">
              {date.date.getDate()}
            </span>
          ) : (
            <>{date.date.getDate()}</>
          )}
        </div>

        {/* content */}
        <div className="h-full w-full hidden md:block">
          <div
            className={cn(
              `h-full w-full select-none ${isDraggingOver ? `${draggingOverBackground} opacity-70` : normalBackground}`,
              {
                "min-h-[5rem]": isMonthLayout,
              }
            )}
          >
            <CalendarIssueBlocks
              date={date.date}
              issueIdList={issueIds}
              quickActions={quickActions}
              loadMoreIssues={loadMoreIssues}
              getPaginationData={getPaginationData}
              getGroupIssueCount={getGroupIssueCount}
              addIssuesToView={addIssuesToView}
              canQuickAddWorkItem={canQuickAddWorkItem}
              quickAddCallback={quickAddCallback}
              getWorkItemPermissions={getWorkItemPermissions}
              isEpic={isEpic}
            />
          </div>
        </div>

        {/* Mobile view content */}
        <div
          onClick={() => setSelectedDate(date.date)}
          className={cn(
            "text-13 py-2.5 h-full w-full font-medium mx-auto flex flex-col justify-start items-center md:hidden cursor-pointer opacity-80",
            {
              "bg-layer-2": !isWeekend,
            }
          )}
        >
          <div
            className={cn("size-6 flex items-center justify-center rounded-full", {
              "bg-accent-primary text-on-color": isSelectedDate,
              "bg-accent-primary/10 text-accent-primary ": isToday && !isSelectedDate,
            })}
          >
            {date.date.getDate()}
          </div>
        </div>
      </div>
    </>
  );
});
