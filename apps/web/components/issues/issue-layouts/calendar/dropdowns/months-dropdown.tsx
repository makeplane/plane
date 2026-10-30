/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
//hooks
// icons
// constants
import { getDate } from "@plane/utils";
import { MONTHS_LIST } from "@plane/constants";
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
  const { currentLocale, t } = useTranslation();
  const { issuesFilterStore } = props;

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const { activeMonthDate } = issueCalendarView.calendarFilters;

  const monthName = (date: Date, short = false) =>
    new Intl.DateTimeFormat(currentLocale, { month: short ? "short" : "long" }).format(date);
  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = issueCalendarView.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return t("web_ui.week_view");

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = getDate(daysList[0]);
    const lastDay = getDate(daysList[daysList.length - 1]);

    if (!firstDay || !lastDay) return t("web_ui.week_view");

    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear())
      return `${monthName(firstDay, false)} ${firstDay.getFullYear()}`;

    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
      return `${monthName(firstDay, true)} ${firstDay.getFullYear()} - ${monthName(
        lastDay,
        true
      )} ${lastDay.getFullYear()}`;
    } else return `${monthName(firstDay, true)} - ${monthName(lastDay, true)} ${lastDay.getFullYear()}`;
  };

  const handleDateChange = (date: Date) => {
    issueCalendarView.updateCalendarFilters({
      activeMonthDate: date,
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        disabled={calendarLayout === "week"}
        render={
          <button type="button" className="text-18 font-semibold outline-none">
            {calendarLayout === "month"
              ? `${monthName(activeMonthDate, false)} ${activeMonthDate.getFullYear()}`
              : getWeekLayoutHeader()}
          </button>
        }
      />
      <PopoverContent variant="rich" side="bottom" align="start" collisionPadding={12}>
        <div className="w-56 divide-y divide-subtle-1">
          <div className="flex items-center justify-between gap-2 pb-3">
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                const previousYear = new Date(activeMonthDate.getFullYear() - 1, activeMonthDate.getMonth(), 1);
                handleDateChange(previousYear);
              }}
            >
              <ChevronLeftOutline height={14} width={14} />
            </button>
            <span className="text-11">{activeMonthDate.getFullYear()}</span>
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                const nextYear = new Date(activeMonthDate.getFullYear() + 1, activeMonthDate.getMonth(), 1);
                handleDateChange(nextYear);
              }}
            >
              <ChevronRightOutline height={14} width={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
            {Object.values(MONTHS_LIST).map((month, index) => (
              <button
                key={month.shortTitle}
                type="button"
                className="rounded-sm py-0.5 text-11 hover:bg-layer-1"
                onClick={() => {
                  const newDate = new Date(activeMonthDate.getFullYear(), index, 1);
                  handleDateChange(newDate);
                }}
              >
                {month.shortTitle}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
