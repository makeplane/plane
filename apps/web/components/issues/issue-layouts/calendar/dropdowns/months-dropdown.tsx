/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Toggle } from "@makeplane/propel/components/toggle";
import { useTranslation } from "@plane/i18n";
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
  const { issuesFilterStore } = props;
  const { t } = useTranslation();

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const { activeMonthDate } = issueCalendarView.calendarFilters;

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = issueCalendarView.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return "Week view";

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = getDate(daysList[0]);
    const lastDay = getDate(daysList[daysList.length - 1]);

    if (!firstDay || !lastDay) return "Week view";

    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear())
      return `${MONTHS_LIST[firstDay.getMonth() + 1].title} ${firstDay.getFullYear()}`;

    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} ${firstDay.getFullYear()} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
    } else
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
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
          <button
            type="button"
            className="rounded-xs text-h5-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
          >
            {calendarLayout === "month"
              ? `${MONTHS_LIST[activeMonthDate.getMonth() + 1].title} ${activeMonthDate.getFullYear()}`
              : getWeekLayoutHeader()}
          </button>
        }
      />
      <PopoverContent variant="rich" side="bottom" align="start" collisionPadding={12}>
        <div className="w-56 divide-y divide-subtle-1">
          <div className="flex items-center justify-between gap-2 pb-3">
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={`${t("prev")} ${activeMonthDate.getFullYear() - 1}`}
              icon={<ChevronLeftOutline height={14} width={14} />}
              onClick={() => {
                const previousYear = new Date(activeMonthDate.getFullYear() - 1, activeMonthDate.getMonth(), 1);
                handleDateChange(previousYear);
              }}
            />
            <span className="text-caption-sm-regular">{activeMonthDate.getFullYear()}</span>
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={`${t("next")} ${activeMonthDate.getFullYear() + 1}`}
              icon={<ChevronRightOutline height={14} width={14} />}
              onClick={() => {
                const nextYear = new Date(activeMonthDate.getFullYear() + 1, activeMonthDate.getMonth(), 1);
                handleDateChange(nextYear);
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
            {Object.values(MONTHS_LIST).map((month, index) => (
              <Toggle
                key={month.shortTitle}
                size="xs"
                label={month.shortTitle}
                aria-label={`${month.title} ${activeMonthDate.getFullYear()}`}
                pressed={activeMonthDate.getMonth() === index}
                onClick={() => {
                  const newDate = new Date(activeMonthDate.getFullYear(), index, 1);
                  handleDateChange(newDate);
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
