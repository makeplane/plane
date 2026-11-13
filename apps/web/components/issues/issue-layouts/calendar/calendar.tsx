/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// plane constants
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
// types
import type {
  TGroupedIssues,
  TIssue,
  TIssueMap,
  TPaginationData,
  ICalendarWeek,
  TSupportedFilterForUpdate,
} from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// ui
import { Spinner } from "@plane/blocks/spinner";
import { renderFormattedPayloadDate, cn } from "@plane/utils";
// constants
import { MONTHS_LIST } from "@plane/constants";
// helpers
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import useSize from "@/hooks/use-window-size";
// store
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { ICalendarStore } from "@/store/issue/issue_calendar_view.store";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
// local imports
import { IssueLayoutHOC } from "../issue-layout-HOC";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarHeader } from "./header";
import { CalendarIssueBlocks } from "./issue-blocks";
import { CalendarWeekDays } from "./week-days";
import { CalendarWeekHeader } from "./week-header";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  layout: "month" | "week" | undefined;
  showWeekends: boolean;
  issueCalendarView: ICalendarStore;
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
  readOnly?: boolean;
  updateFilters?: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
};

export const CalendarChart = observer(function CalendarChart(props: Props) {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    layout,
    showWeekends,
    issueCalendarView,
    loadMoreIssues,
    handleDragAndDrop,
    quickActions,
    quickAddCallback,
    addIssuesToView,
    getPaginationData,
    getGroupIssueCount,
    updateFilters,
    canEditProperties,
    readOnly = false,
    isEpic = false,
  } = props;
  // states
  const [pickedDate, setPickedDate] = useState<Date>(new Date());
  //refs
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const {
    issues: { viewFlags },
  } = useIssues(EIssuesStoreType.PROJECT);

  const [windowWidth] = useSize();

  const { enableIssueCreation, enableQuickAdd } = viewFlags || {};

  const calendarPayload = issueCalendarView.calendarPayload;

  const allWeeksOfActiveMonth = issueCalendarView.allWeeksOfActiveMonth;

  // Paging the calendar keeps the picked date, so a date out of view falls back to the active one.
  const { activeMonthDate, activeWeekDate } = issueCalendarView.calendarFilters;
  const visibleWeeks =
    layout === "week" ? [issueCalendarView.allDaysOfActiveWeek] : Object.values(allWeeksOfActiveMonth ?? {});
  const isInView = (date: Date) => {
    const payload = renderFormattedPayloadDate(date) ?? "";
    return visibleWeeks.some((week) => !!week?.[payload]);
  };
  // A day with no tile (out of view, or a weekend while weekends are hidden) moves to the nearest shown day.
  const isShownDay = (date: Date) => isInView(date) && (showWeekends || (date.getDay() !== 0 && date.getDay() !== 6));
  const activeDate = layout === "week" ? activeWeekDate : activeMonthDate;
  const baseDate = isInView(pickedDate) ? pickedDate : activeDate;
  const fallbackDate =
    [0, 1, 2, -1, -2]
      .map((days) => new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + days))
      .find(isShownDay) ?? baseDate;
  const selectedDate = isShownDay(pickedDate) ? pickedDate : fallbackDate;

  const formattedDatePayload = renderFormattedPayloadDate(selectedDate) ?? undefined;

  // Enable Auto Scroll for calendar
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, []);

  if (!calendarPayload || !formattedDatePayload)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : [];

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CalendarHeader
          setSelectedDate={setPickedDate}
          issuesFilterStore={issuesFilterStore}
          updateFilters={updateFilters}
        />

        <IssueLayoutHOC layout={EIssueLayoutTypes.CALENDAR}>
          <div
            className={cn("flex w-full flex-col overflow-y-auto md:h-full", {
              "vertical-scrollbar scrollbar-lg": windowWidth > 768,
            })}
            ref={scrollableContainerRef}
          >
            <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />
            <div className="h-full w-full">
              {layout === "month" && (
                <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-subtle-1">
                  {allWeeksOfActiveMonth &&
                    Object.entries(allWeeksOfActiveMonth).map(([weekNumber, week]: [string, ICalendarWeek]) => (
                      <CalendarWeekDays
                        selectedDate={selectedDate}
                        setSelectedDate={setPickedDate}
                        handleDragAndDrop={handleDragAndDrop}
                        issuesFilterStore={issuesFilterStore}
                        key={weekNumber}
                        week={week}
                        issues={issues}
                        groupedIssueIds={groupedIssueIds}
                        loadMoreIssues={loadMoreIssues}
                        getPaginationData={getPaginationData}
                        getGroupIssueCount={getGroupIssueCount}
                        enableQuickIssueCreate={enableQuickAdd}
                        disableIssueCreation={!enableIssueCreation}
                        quickActions={quickActions}
                        quickAddCallback={quickAddCallback}
                        addIssuesToView={addIssuesToView}
                        readOnly={readOnly}
                        canEditProperties={canEditProperties}
                        isEpic={isEpic}
                      />
                    ))}
                </div>
              )}
              {layout === "week" && (
                <CalendarWeekDays
                  selectedDate={selectedDate}
                  setSelectedDate={setPickedDate}
                  handleDragAndDrop={handleDragAndDrop}
                  issuesFilterStore={issuesFilterStore}
                  week={issueCalendarView.allDaysOfActiveWeek}
                  issues={issues}
                  groupedIssueIds={groupedIssueIds}
                  loadMoreIssues={loadMoreIssues}
                  getPaginationData={getPaginationData}
                  getGroupIssueCount={getGroupIssueCount}
                  enableQuickIssueCreate={enableQuickAdd}
                  disableIssueCreation={!enableIssueCreation}
                  quickActions={quickActions}
                  quickAddCallback={quickAddCallback}
                  addIssuesToView={addIssuesToView}
                  readOnly={readOnly}
                  canEditProperties={canEditProperties}
                  isEpic={isEpic}
                />
              )}
            </div>

            {/* mobile view */}
            <div className="md:hidden">
              <p className="p-4 text-h5-semibold">
                {`${selectedDate.getDate()} ${
                  MONTHS_LIST[selectedDate.getMonth() + 1].title
                }, ${selectedDate.getFullYear()}`}
              </p>
              <CalendarIssueBlocks
                date={selectedDate}
                issueIdList={issueIdList}
                loadMoreIssues={loadMoreIssues}
                getPaginationData={getPaginationData}
                getGroupIssueCount={getGroupIssueCount}
                quickActions={quickActions}
                enableQuickIssueCreate={enableQuickAdd}
                disableIssueCreation={!enableIssueCreation}
                quickAddCallback={quickAddCallback}
                addIssuesToView={addIssuesToView}
                readOnly={readOnly}
                canEditProperties={canEditProperties}
                isDragDisabled
                isMobileView
                isEpic={isEpic}
              />
            </div>
          </div>
        </IssueLayoutHOC>

        {/* mobile view */}
        <div className="md:hidden">
          <p className="p-4 text-h5-semibold">
            {`${selectedDate.getDate()} ${
              MONTHS_LIST[selectedDate.getMonth() + 1].title
            }, ${selectedDate.getFullYear()}`}
          </p>
          <CalendarIssueBlocks
            date={selectedDate}
            issueIdList={issueIdList}
            quickActions={quickActions}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            enableQuickIssueCreate={enableQuickAdd}
            disableIssueCreation={!enableIssueCreation}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            canEditProperties={canEditProperties}
            isDragDisabled
            isMobileView
            isEpic={isEpic}
          />
        </div>
      </div>
    </>
  );
});
