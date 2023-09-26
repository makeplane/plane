import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
// components
import { SingleCalendarDate, CalendarHeader } from "components/core";
import { IssuePeekOverview } from "components/issues";
// ui
import { Spinner } from "components/ui";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
import {
  startOfWeek,
  lastDayOfWeek,
  eachDayOfInterval,
  weekDayInterval,
  formatDate,
} from "helpers/calendar.helper";
// types
import { ICalendarRange, ICurrentUserResponse, IIssue, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

type Props = {
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  addIssueToDate: (date: string) => void;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const CalendarView: React.FC<Props> = ({
  handleIssueAction,
  addIssueToDate,
  disableUserActions,
  user,
  userAuth,
}) => {
  const [showWeekEnds, setShowWeekEnds] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMonthlyView, setIsMonthlyView] = useState(true);

  const [calendarDates, setCalendarDates] = useState<ICalendarRange>({
    startDate: startOfWeek(currentDate),
    endDate: lastDayOfWeek(currentDate),
  });

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { calendarIssues, mutateIssues, params, displayFilters, setDisplayFilters } =
    useCalendarIssuesView();

  const totalDate = eachDayOfInterval({
    start: calendarDates.startDate,
    end: calendarDates.endDate,
  });

  const onlyWeekDays = weekDayInterval({
    start: calendarDates.startDate,
    end: calendarDates.endDate,
  });

  const currentViewDays = showWeekEnds ? totalDate : onlyWeekDays;

  const currentViewDaysData = currentViewDays.map((date: Date) => {
    const filterIssue =
      calendarIssues.length > 0
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
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
      : moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
      : viewId
      ? VIEW_ISSUES(viewId.toString(), params)
      : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params);

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

    issuesService
      .patchIssue(
        workspaceSlug as string,
        projectId as string,
        draggableId,
        {
          target_date: destination?.droppableId,
        },
        user
      )
      .then(() => mutate(fetchKey));
  };

  const changeDateRange = (startDate: Date, endDate: Date) => {
    setCalendarDates({
      startDate,
      endDate,
    });

    setDisplayFilters({
      calendar_date_range: `${renderDateFormat(startDate)};after,${renderDateFormat(
        endDate
      )};before`,
    });
  };

  useEffect(() => {
    if (!displayFilters || displayFilters.calendar_date_range === "")
      setDisplayFilters({
        calendar_date_range: `${renderDateFormat(
          startOfWeek(currentDate)
        )};after,${renderDateFormat(lastDayOfWeek(currentDate))};before`,
      });
  }, [currentDate, displayFilters, setDisplayFilters]);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disableUserActions;

  return (
    <>
      <IssuePeekOverview
        handleMutation={() => mutateIssues()}
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      {calendarIssues ? (
        <div className="h-full overflow-y-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <div
              id={`calendar-view-${cycleId ?? moduleId ?? viewId ?? ""}`}
              className="h-full rounded-lg p-8 text-custom-text-200"
            >
              <CalendarHeader
                isMonthlyView={isMonthlyView}
                setIsMonthlyView={setIsMonthlyView}
                showWeekEnds={showWeekEnds}
                setShowWeekEnds={setShowWeekEnds}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                changeDateRange={changeDateRange}
              />

              <div
                className={`grid auto-rows-[minmax(36px,1fr)] rounded-lg ${
                  showWeekEnds ? "grid-cols-7" : "grid-cols-5"
                }`}
              >
                {weeks.map((date, index) => (
                  <div
                    key={index}
                    className={`flex  items-center justify-start gap-2 border-custom-border-200 bg-custom-background-90 p-1.5 text-base font-medium text-custom-text-200 ${
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
                    key={`${date}-${index}`}
                    index={index}
                    date={date}
                    handleIssueAction={handleIssueAction}
                    addIssueToDate={addIssueToDate}
                    isMonthlyView={isMonthlyView}
                    showWeekEnds={showWeekEnds}
                    user={user}
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
      )}
    </>
  );
};
