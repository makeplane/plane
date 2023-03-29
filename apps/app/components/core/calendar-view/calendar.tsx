import React, { useState } from "react";

import useSWR, { mutate } from "swr";

import Link from "next/link";
import { useRouter } from "next/router";

// helper
import { renderDateFormat } from "helpers/date-time.helper";
import {
  startOfWeek,
  lastDayOfWeek,
  eachDayOfInterval,
  weekDayInterval,
  formatDate,
  getCurrentWeekStartDate,
  getCurrentWeekEndDate,
} from "helpers/calendar.helper";
// ui
import { Popover, Transition } from "@headlessui/react";
import ReactDatePicker from "react-datepicker";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CustomMenu } from "components/ui";
// icon
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
// services
import issuesService from "services/issues.service";
// fetch key
import { CALENDAR_ISSUES, ISSUE_DETAILS } from "constants/fetch-keys";
// type
import { IIssue } from "types";

interface ICalendarRange {
  startDate: Date;
  endDate: Date;
}

export const CalendarView = () => {
  const [showWeekEnds, setShowWeekEnds] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isMonthlyView, setIsMonthlyView] = useState<boolean>(true);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [calendarDateRange, setCalendarDateRange] = useState<ICalendarRange>({
    startDate: startOfWeek(currentDate),
    endDate: lastDayOfWeek(currentDate),
  });

  const { data: calendarIssues } = useSWR(
    workspaceSlug && projectId ? CALENDAR_ISSUES(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, {
            target_date: `${renderDateFormat(calendarDateRange.startDate)};after,${renderDateFormat(
              calendarDateRange.endDate
            )};before`,
          })
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

  const currentViewDaysData = currentViewDays.map((date: Date) => {
    const filterIssue =
      calendarIssues && calendarIssues.length > 0
        ? (calendarIssues as IIssue[]).filter(
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

    mutate<IIssue[]>(
      CALENDAR_ISSUES(projectId as string),
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
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="h-full overflow-y-auto rounded-lg text-gray-600 -m-2">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative flex h-full w-full items-center justify-start text-sm ">
            <Popover className="flex h-full items-center  justify-center rounded-lg">
              {({ open }) => (
                <>
                  <Popover.Button className={`group flex h-full items-start gap-1 text-gray-800`}>
                    <div className="flex  items-center  justify-center gap-2 text-2xl font-semibold">
                      <span className="text-black">{formatDate(currentDate, "Month")}</span>{" "}
                      <span>{formatDate(currentDate, "yyyy")}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </div>
                  </Popover.Button>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute top-10 left-0 z-20 w-full  transform overflow-hidden">
                      <ReactDatePicker
                        selected={currentDate}
                        onChange={(date) => {
                          date && setCurrentDate(date);
                          date &&
                            setCalendarDateRange({
                              startDate: startOfWeek(date),
                              endDate: lastDayOfWeek(date),
                            });
                        }}
                        dateFormat="MM/yyyy"
                        showMonthYearPicker
                        inline
                      />
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>

          <div className="flex w-full items-center justify-end">
            <CustomMenu
              customButton={
                <div
                  className={`group flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm  hover:bg-gray-100 hover:text-gray-900 focus:outline-none `}
                >
                  {isMonthlyView ? "Monthly" : "Weekly"}
                  <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                </div>
              }
            >
              <CustomMenu.MenuItem
                onClick={() => {
                  setIsMonthlyView(true);
                  setCalendarDateRange({
                    startDate: startOfWeek(currentDate),
                    endDate: lastDayOfWeek(currentDate),
                  });
                }}
                className="w-52 text-sm text-gray-600"
              >
                <div className="flex w-full max-w-[260px] items-center justify-between gap-2">
                  <span className="flex items-center gap-2">Monthly View</span>
                  <CheckIcon
                    className={`h-4 w-4 flex-shrink-0 ${
                      isMonthlyView ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  setIsMonthlyView(false);
                  setCalendarDateRange({
                    startDate: getCurrentWeekStartDate(),
                    endDate: getCurrentWeekEndDate(),
                  });
                }}
                className="w-52 text-sm text-gray-600"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-2">Weekly View</span>
                  <CheckIcon
                    className={`h-4 w-4 flex-shrink-0 ${
                      isMonthlyView ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              </CustomMenu.MenuItem>
              {/* <CustomMenu.MenuItem className="w-56 border-t border-gray-200 text-sm text-gray-600 rounded-none hover:bg-white"> */}
              <div className="mt-1 flex w-52 items-center justify-between border-t border-gray-200 py-2 px-1  text-sm text-gray-600">
                <h4>Show weekends</h4>
                <button
                  type="button"
                  className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showWeekEnds ? "bg-green-500" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={showWeekEnds}
                  onClick={() => setShowWeekEnds(!showWeekEnds)}
                >
                  <span className="sr-only">Show weekends</span>
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showWeekEnds ? "translate-x-2.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CustomMenu>
          </div>
        </div>

        <div
          className={`grid auto-rows-[minmax(36px,1fr)] rounded-lg ${
            showWeekEnds ? "grid-cols-7" : "grid-cols-5"
          }`}
        >
          {weeks.map((date, index) => (
            <div
              key={index}
              className={`flex  items-center justify-start p-1.5 gap-2 border-gray-300 bg-gray-100 text-base font-medium text-gray-600 ${
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
              <span>{isMonthlyView ? formatDate(date, "eee").substring(0, 3) : formatDate(date, "eee")}</span>
              {!isMonthlyView && <span>{formatDate(date, "d")}</span>}
            </div>
          ))}
        </div>

        <div
          className={`grid h-full auto-rows-[minmax(170px,1fr)] ${
            showWeekEnds ? "grid-cols-7" : "grid-cols-5"
          } `}
        >
          {currentViewDaysData.map((date, index) => (
            <StrictModeDroppable droppableId={date.date}>
              {(provided, snapshot) => (
                <div
                  key={index}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col gap-1.5 border-t border-gray-300 p-2.5 text-left text-sm font-medium hover:bg-gray-100 ${
                    showWeekEnds
                      ? (index + 1) % 7 === 0
                        ? ""
                        : "border-r"
                      : (index + 1) % 5 === 0
                      ? ""
                      : "border-r"
                  }`}
                >
                  {isMonthlyView && <span>{formatDate(new Date(date.date), "d")}</span>}
                  {date.issues.length > 0 &&
                    date.issues.map((issue: IIssue, index) => (
                      <Draggable draggableId={issue.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            key={index}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`w-full cursor-pointer rounded bg-white p-1.5 hover:scale-105 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <Link
                              href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}
                              className="w-full"
                            >
                              {issue.name}
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};
