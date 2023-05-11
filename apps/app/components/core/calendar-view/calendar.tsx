import React, { useState } from "react";

// swr
import useSWR, { mutate } from "swr";

import { useRouter } from "next/router";

// ui
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { SingleCalendarDate, CalendarHeader } from "components/core";

import { Spinner } from "components/ui";
// hooks
import useIssuesView from "hooks/use-issues-view";
// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
// fetch key
import {
  CYCLE_CALENDAR_ISSUES,
  MODULE_CALENDAR_ISSUES,
  PROJECT_CALENDAR_ISSUES,
} from "constants/fetch-keys";
// helper
import { renderDateFormat } from "helpers/date-time.helper";
import {
  startOfWeek,
  lastDayOfWeek,
  eachDayOfInterval,
  weekDayInterval,
  formatDate,
} from "helpers/calendar.helper";
// type
import { ICalendarRange, IIssue, UserAuth } from "types";

type Props = {
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  addIssueToDate: (date: string) => void;
  isCompleted: boolean;
  userAuth: UserAuth;
};

export const CalendarView: React.FC<Props> = ({
  handleEditIssue,
  handleDeleteIssue,
  addIssueToDate,
  isCompleted = false,
  userAuth,
}) => {
  const [showWeekEnds, setShowWeekEnds] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMonthlyView, setIsMonthlyView] = useState(true);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { params } = useIssuesView();

  const [calendarDateRange, setCalendarDateRange] = useState<ICalendarRange>({
    startDate: startOfWeek(currentDate),
    endDate: lastDayOfWeek(currentDate),
  });

  const { data: projectCalendarIssues } = useSWR(
    workspaceSlug && projectId ? PROJECT_CALENDAR_ISSUES(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, {
            ...params,
            target_date: `${renderDateFormat(calendarDateRange.startDate)};after,${renderDateFormat(
              calendarDateRange.endDate
            )};before`,
            group_by: null,
          })
      : null
  );

  const { data: cycleCalendarIssues } = useSWR(
    workspaceSlug && projectId && cycleId
      ? CYCLE_CALENDAR_ISSUES(projectId as string, cycleId as string)
      : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            cycleId as string,
            {
              ...params,
              target_date: `${renderDateFormat(
                calendarDateRange.startDate
              )};after,${renderDateFormat(calendarDateRange.endDate)};before`,
              group_by: null,
            }
          )
      : null
  );

  const { data: moduleCalendarIssues } = useSWR(
    workspaceSlug && projectId && moduleId
      ? MODULE_CALENDAR_ISSUES(projectId as string, moduleId as string)
      : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            moduleId as string,
            {
              ...params,
              target_date: `${renderDateFormat(
                calendarDateRange.startDate
              )};after,${renderDateFormat(calendarDateRange.endDate)};before`,
              group_by: null,
            }
          )
      : null
  );

  const totalDate = eachDayOfInterval({
    start: calendarDateRange.startDate,
    end: calendarDateRange.endDate,
  });

  const onlyWeekDays = weekDayInterval({
    start: calendarDateRange.startDate,
    end: calendarDateRange.endDate,
  });

  const currentViewDays = showWeekEnds ? totalDate : onlyWeekDays;

  const calendarIssues = cycleId
    ? (cycleCalendarIssues as IIssue[])
    : moduleId
    ? (moduleCalendarIssues as IIssue[])
    : (projectCalendarIssues as IIssue[]);

  const currentViewDaysData = currentViewDays.map((date: Date) => {
    const filterIssue =
      calendarIssues && calendarIssues.length > 0
        ? calendarIssues.filter(
            (issue) =>
              issue.target_date && renderDateFormat(issue.target_date) === renderDateFormat(date)
          )
        : [];
    return {
      date: renderDateFormat(date),
      issues: filterIssue,
    };
  });

  const weeks = ((date: Date[]) => {
    const weeks = [];
    if (showWeekEnds) {
      for (let day = 0; day <= 6; day++) {
        weeks.push(date[day]);
      }
    } else {
      for (let day = 0; day <= 4; day++) {
        weeks.push(date[day]);
      }
    }

    return weeks;
  })(currentViewDays);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !workspaceSlug || !projectId) return;
    if (source.droppableId === destination.droppableId) return;

    const fetchKey = cycleId
      ? CYCLE_CALENDAR_ISSUES(projectId as string, cycleId as string)
      : moduleId
      ? MODULE_CALENDAR_ISSUES(projectId as string, moduleId as string)
      : PROJECT_CALENDAR_ISSUES(projectId as string);

    mutate<IIssue[]>(
      fetchKey,
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === draggableId)
            return {
              ...p,
              target_date: destination.droppableId,
            };
          return p;
        }),
      false
    );

    issuesService.patchIssue(workspaceSlug as string, projectId as string, draggableId, {
      target_date: destination?.droppableId,
    });
  };

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || isCompleted;

  return calendarIssues ? (
    <div className="mb-4 h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="-m-2 h-full rounded-lg p-8 text-brand-secondary">
          <CalendarHeader
            isMonthlyView={isMonthlyView}
            setIsMonthlyView={setIsMonthlyView}
            showWeekEnds={showWeekEnds}
            setShowWeekEnds={setShowWeekEnds}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            setCalendarDateRange={setCalendarDateRange}
          />

          <div
            className={`grid auto-rows-[minmax(36px,1fr)] rounded-lg ${
              showWeekEnds ? "grid-cols-7" : "grid-cols-5"
            }`}
          >
            {weeks.map((date, index) => (
              <div
                key={index}
                className={`flex  items-center justify-start gap-2 border-brand-base bg-brand-surface-1 p-1.5 text-base font-medium text-brand-secondary ${
                  !isMonthlyView
                    ? showWeekEnds
                      ? (index + 1) % 7 === 0
                        ? ""
                        : "border-r"
                      : (index + 1) % 5 === 0
                      ? ""
                      : "border-r"
                    : ""
                }`}
              >
                <span>
                  {isMonthlyView
                    ? formatDate(date, "eee").substring(0, 3)
                    : formatDate(date, "eee")}
                </span>
                {!isMonthlyView && <span>{formatDate(date, "d")}</span>}
              </div>
            ))}
          </div>

          <div
            className={`grid h-full ${isMonthlyView ? "auto-rows-min" : ""} ${
              showWeekEnds ? "grid-cols-7" : "grid-cols-5"
            } `}
          >
            {currentViewDaysData.map((date, index) => (
              <SingleCalendarDate
                index={index}
                date={date}
                handleEditIssue={handleEditIssue}
                handleDeleteIssue={handleDeleteIssue}
                addIssueToDate={addIssueToDate}
                isMonthlyView={isMonthlyView}
                showWeekEnds={showWeekEnds}
                isNotAllowed={isNotAllowed}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  );
};
