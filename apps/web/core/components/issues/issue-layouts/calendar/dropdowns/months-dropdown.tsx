/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@plane/propel/icons";
//hooks
// icons
// constants
import { getDate, getCalendarSystem } from "@plane/utils"; // [FA-CUSTOM] added getCalendarSystem
import {
  getYear as jalaliGetYear,
  getMonth as jalaliGetMonth,
  subYears as jalaliSubYears,
  addYears as jalaliAddYears,
  setMonth as jalaliSetMonth,
} from "date-fns-jalali"; // [FA-CUSTOM]
import { MONTHS_LIST, JALALI_MONTHS_LIST } from "@/constants/calendar"; // [FA-CUSTOM] added JALALI_MONTHS_LIST
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
// helpers

interface Props {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
}
export const CalendarMonthsDropdown = observer(function CalendarMonthsDropdown(props: Props) {
  const { issuesFilterStore } = props;

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const { activeMonthDate } = issueCalendarView.calendarFilters;

  // [FA-CUSTOM] Calendar-aware week layout header
  const isJalali = getCalendarSystem() === "jalali";
  const activeMonthList = isJalali ? JALALI_MONTHS_LIST : MONTHS_LIST;

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = issueCalendarView.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return "Week view";

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = getDate(daysList[0]);
    const lastDay = getDate(daysList[daysList.length - 1]);

    if (!firstDay || !lastDay) return "Week view";

    // [FA-CUSTOM] Calendar-aware month names for week header
    const firstMonth = isJalali ? jalaliGetMonth(firstDay) : firstDay.getMonth();
    const firstYear = isJalali ? jalaliGetYear(firstDay) : firstDay.getFullYear();
    const lastMonth = isJalali ? jalaliGetMonth(lastDay) : lastDay.getMonth();
    const lastYear = isJalali ? jalaliGetYear(lastDay) : lastDay.getFullYear();

    if (firstMonth === lastMonth && firstYear === lastYear)
      return `${activeMonthList[firstMonth + 1].title} ${firstYear}`;

    if (firstYear !== lastYear) {
      return `${activeMonthList[firstMonth + 1].shortTitle} ${firstYear} - ${activeMonthList[lastMonth + 1].shortTitle} ${lastYear}`;
    } else
      return `${activeMonthList[firstMonth + 1].shortTitle} - ${activeMonthList[lastMonth + 1].shortTitle} ${lastYear}`;
  };

  const handleDateChange = (date: Date) => {
    issueCalendarView.updateCalendarFilters({
      activeMonthDate: date,
    });
  };

  return (
    <Popover className="relative">
      <Popover.Button as={React.Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className="text-18 font-semibold outline-none"
          disabled={calendarLayout === "week"}
        >
          {/* [FA-CUSTOM] Calendar-aware month/year display */}
          {calendarLayout === "month"
            ? `${activeMonthList[(isJalali ? jalaliGetMonth(activeMonthDate) : activeMonthDate.getMonth()) + 1].title} ${isJalali ? jalaliGetYear(activeMonthDate) : activeMonthDate.getFullYear()}`
            : getWeekLayoutHeader()}
        </button>
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
        <Popover.Panel className="fixed z-50">
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="w-56 divide-y divide-subtle-1 rounded-sm border border-subtle bg-surface-1 p-3 shadow-raised-200"
          >
            {/* [FA-CUSTOM] Calendar-aware year navigation and month picker */}
            <div className="flex items-center justify-between gap-2 pb-3">
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const previousYear = isJalali
                    ? jalaliSubYears(activeMonthDate, 1)
                    : new Date(activeMonthDate.getFullYear() - 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(previousYear);
                }}
              >
                <ChevronLeftIcon height={14} width={14} />
              </button>
              <span className="text-11">
                {isJalali ? jalaliGetYear(activeMonthDate) : activeMonthDate.getFullYear()}
              </span>
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const nextYear = isJalali
                    ? jalaliAddYears(activeMonthDate, 1)
                    : new Date(activeMonthDate.getFullYear() + 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(nextYear);
                }}
              >
                <ChevronRightIcon height={14} width={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
              {Object.values(activeMonthList).map((month, index) => (
                <button
                  key={month.shortTitle}
                  type="button"
                  className="rounded-sm py-0.5 text-11 hover:bg-layer-1"
                  onClick={() => {
                    const newDate = isJalali
                      ? jalaliSetMonth(activeMonthDate, index)
                      : new Date(activeMonthDate.getFullYear(), index, 1);
                    handleDateChange(newDate);
                  }}
                >
                  {month.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
