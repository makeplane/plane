import React, { useState } from "react";

import useSWR from "swr";

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
import { CustomSelect } from "components/ui";
// icon
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
// services
import issuesService from "services/issues.service";
// fetch key
import { CALENDAR_ISSUES } from "constants/fetch-keys";
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
      day: formatDate(new Date(date), "d"),
      issue: filterIssue,
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

  return (
    <div className="h-full overflow-y-auto rounded-lg text-gray-600">

      <div className="mb-4 flex items-center  justify-between">
        <div className="relative flex h-full w-full items-center justify-start text-sm ">
          <Popover className="flex h-full items-center  justify-center rounded-lg">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group flex h-full items-start gap-1 px-2.5 py-1.5 text-gray-800`}
                >
                  <div className="flex  items-center  justify-center gap-1 text-3xl font-semibold">
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
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm  hover:bg-gray-100 hover:text-gray-900 focus:outline-none ${
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500"
                  }`}
                >
                  {isMonthlyView ? "Monthly" : "Weekly"}
                  <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
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
                  <Popover.Panel className="absolute right-0 z-20 mt-1 flex w-screen max-w-[260px] transform flex-col items-start  gap-2 overflow-hidden rounded-lg bg-white p-3 text-sm shadow-lg">
                    <button
                      className="flex w-full items-center justify-between gap-2"
                      onClick={() => {
                        setIsMonthlyView(true);
                        setCalendarDateRange({
                          startDate: startOfWeek(currentDate),
                          endDate: lastDayOfWeek(currentDate),
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">Monthly View</div>
                      <CheckIcon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isMonthlyView ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </button>

                    <button
                      className="flex w-full items-center justify-between gap-2"
                      onClick={() => {
                        setIsMonthlyView(false);
                        setCalendarDateRange({
                          startDate: getCurrentWeekStartDate(),
                          endDate: getCurrentWeekEndDate(),
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">Weekly View</div>
                      <CheckIcon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isMonthlyView ? "opacity-0" : "opacity-100"
                        }`}
                      />
                    </button>

                    <div className="flex w-full items-center justify-between">
                      <h4 className="text-gray-600">Show weekends</h4>
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
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
      </div>

      <div
        className={`grid auto-rows-[minmax(50px,1fr)] rounded-lg ${
          showWeekEnds ? "grid-cols-7" : "grid-cols-5"
        }`}
      >
        {weeks.map((date, index) => (
          <div
            key={index}
            className={`flex flex-col items-start justify-start gap-1 border-gray-300 bg-gray-100 text-base font-medium text-gray-600 ${
              showWeekEnds
                ? (index + 1) % 7 === 0
                  ? ""
                  : "border-r"
                : (index + 1) % 5 === 0
                ? ""
                : "border-r"
            } ${isMonthlyView ? "px-3 py-4" : "p-1.5"}`}
          >
            <span>{formatDate(date, "eee")}</span>
            {!isMonthlyView && <span>{formatDate(date, "d")}</span>}
          </div>
        ))}
      </div>

      <div
        className={`grid h-full auto-rows-[minmax(170px,1fr)] ${
          showWeekEnds ? "grid-cols-7" : "grid-cols-5"
        } `}
      >
        {currentViewDaysData.map((d, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1 border-t border-gray-300 px-3 py-4 text-left text-base font-medium ${
              showWeekEnds
                ? (index + 1) % 7 === 0
                  ? ""
                  : "border-r"
                : (index + 1) % 5 === 0
                ? ""
                : "border-r"
            }`}
          >
            {isMonthlyView && <span>{d.day}</span>}
            {d.issue.length > 0 &&
              d.issue.map((i: any, index: any) => (
                <Link
                  key={index}
                  href={`/${workspaceSlug}/projects/${i?.project_detail?.id}/issues/${i.id}`}
                >
                  <span className="cursor-pointer rounded bg-white p-1.5">{i.name}</span>
                </Link>
              ))}
          </div>
        ))}
      </div>

    </div>
  );
};
