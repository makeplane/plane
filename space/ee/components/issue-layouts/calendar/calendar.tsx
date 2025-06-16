"use client";

import { useRef, useState } from "react";
import { observer } from "mobx-react";
// plane
import type { TGroupedIssues, TLoader, TPaginationData, ICalendarWeek } from "@plane/types";
import { Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
// plane web
import { MONTHS_LIST } from "@/plane-web/constants/calendar";
import { renderFormattedPayloadDate } from "@/plane-web/helpers/date-time.helper";
import useSize from "@/plane-web/hooks/use-window-size";
import { ICalendarStore } from "@/plane-web/store/issue_calendar_view.store";
// types
import { IIssue } from "@/types/issue";
//
import { CalendarHeader } from "./header";
import { CalendarIssueBlocks } from "./issue-blocks";
import { CalendarWeekDays } from "./week-days";
import { CalendarWeekHeader } from "./week-header";

type Props = {
  getIssueById: (issueId: string) => IIssue | undefined;
  groupedIssueIds: TGroupedIssues;
  calendarLayout: "month" | "week" | undefined;
  showWeekends: boolean;
  issueCalendarView: ICalendarStore;
  loadMoreIssues: (dateString: string) => void;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const {
    getIssueById,
    groupedIssueIds,
    calendarLayout,
    showWeekends,
    issueCalendarView,
    loadMoreIssues,
    getPaginationData,
    getIssueLoader,
    getGroupIssueCount,
  } = props;
  // states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  //refs
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  // store hooks

  const [windowWidth] = useSize();

  const calendarPayload = issueCalendarView.calendarPayload;

  const allWeeksOfActiveMonth = issueCalendarView.allWeeksOfActiveMonth;

  const formattedDatePayload = renderFormattedPayloadDate(selectedDate) ?? undefined;

  if (!calendarPayload || !formattedDatePayload)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : [];
  const loader = getIssueLoader();

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CalendarHeader calendarLayout={calendarLayout} setSelectedDate={setSelectedDate} />

        <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
          <div
            className={cn("flex md:h-full w-full flex-col overflow-y-auto", {
              "vertical-scrollbar scrollbar-lg": windowWidth > 768,
            })}
            ref={scrollableContainerRef}
          >
            <CalendarWeekHeader isLoading={loader === "init-loader"} showWeekends={showWeekends} />
            <div className="h-full w-full">
              {calendarLayout === "month" && (
                <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-custom-border-200">
                  {allWeeksOfActiveMonth &&
                    Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                      <CalendarWeekDays
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        key={weekIndex}
                        week={week}
                        calendarLayout={calendarLayout}
                        showWeekends={showWeekends}
                        getIssueById={getIssueById}
                        groupedIssueIds={groupedIssueIds}
                        loadMoreIssues={loadMoreIssues}
                        getPaginationData={getPaginationData}
                        getGroupIssueCount={getGroupIssueCount}
                      />
                    ))}
                </div>
              )}
              {calendarLayout === "week" && (
                <CalendarWeekDays
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  week={issueCalendarView.allDaysOfActiveWeek}
                  calendarLayout={calendarLayout}
                  showWeekends={showWeekends}
                  getIssueById={getIssueById}
                  groupedIssueIds={groupedIssueIds}
                  loadMoreIssues={loadMoreIssues}
                  getPaginationData={getPaginationData}
                  getGroupIssueCount={getGroupIssueCount}
                />
              )}
            </div>

            {/* mobile view */}
            <div className="md:hidden">
              <p className="p-4 text-xl font-semibold">
                {`${selectedDate.getDate()} ${
                  MONTHS_LIST[selectedDate.getMonth() + 1].title
                }, ${selectedDate.getFullYear()}`}
              </p>
              <CalendarIssueBlocks
                date={selectedDate}
                getIssueById={getIssueById}
                issueIdList={issueIdList}
                loadMoreIssues={loadMoreIssues}
                getPaginationData={getPaginationData}
                getGroupIssueCount={getGroupIssueCount}
              />
            </div>
          </div>
        </IssueLayoutHOC>

        {/* mobile view */}
        <div className="md:hidden">
          <p className="p-4 text-xl font-semibold">
            {`${selectedDate.getDate()} ${
              MONTHS_LIST[selectedDate.getMonth() + 1].title
            }, ${selectedDate.getFullYear()}`}
          </p>
          <CalendarIssueBlocks
            date={selectedDate}
            getIssueById={getIssueById}
            issueIdList={issueIdList}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
          />
        </div>
      </div>
    </>
  );
});
