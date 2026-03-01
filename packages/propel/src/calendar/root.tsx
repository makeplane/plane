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

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CalendarView = "day" | "month" | "year";

type CustomHeaderProps = {
  currentDate: Date;
  onPrevClick: () => void;
  onNextClick: () => void;
  onYearPrevClick?: () => void;
  onYearNextClick?: () => void;
  onTitleClick: () => void;
  view: CalendarView;
};

const getCalendarTitle = (view: CalendarView, currentDate: Date): string => {
  switch (view) {
    case "day":
      return `${currentDate.toLocaleString("default", { month: "short" })} ${currentDate.getFullYear()}`;
    case "month":
      return `${currentDate.getFullYear()}`;
    case "year": {
      const startYear = Math.floor(currentDate.getFullYear() / 10) * 10;
      return `${startYear}-${startYear + 9}`;
    }
    default:
      return "";
  }
};

const CustomHeader = ({
  currentDate,
  onPrevClick,
  onNextClick,
  onYearPrevClick,
  onYearNextClick,
  onTitleClick,
  view,
}: CustomHeaderProps) => {
  const isTitleClickable = view !== "year";

  return (
    <div className="flex items-center justify-between p-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={view === "day" && onYearPrevClick ? onYearPrevClick : onPrevClick}
          className="p-1 hover:bg-surface-2 rounded-md transition-colors text-tertiary hover:text-primary"
        >
          {view === "day" ? <ChevronsLeft className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        {view === "day" && (
          <button
            type="button"
            onClick={onPrevClick}
            className="p-1 hover:bg-surface-2 rounded-md transition-colors text-tertiary hover:text-primary"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      {isTitleClickable ? (
        <button
          type="button"
          onClick={onTitleClick}
          className="text-sm font-semibold hover:bg-surface-2 px-2 py-1 rounded-md transition-colors text-primary"
        >
          {getCalendarTitle(view, currentDate)}
        </button>
      ) : (
        <span className="text-sm font-semibold px-2 py-1 text-primary">{getCalendarTitle(view, currentDate)}</span>
      )}

      <div className="flex items-center gap-1">
        {view === "day" && (
          <button
            type="button"
            onClick={onNextClick}
            className="p-1 hover:bg-surface-2 rounded-md transition-colors text-tertiary hover:text-primary"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={view === "day" && onYearNextClick ? onYearNextClick : onNextClick}
          className="p-1 hover:bg-surface-2 rounded-md transition-colors text-tertiary hover:text-primary"
        >
          {view === "day" ? <ChevronsRight className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>
    </div>
  );
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showTodayButton = false,
  ...props
}: CalendarProps & { showTodayButton?: boolean }) {
  const [view, setView] = useState<CalendarView>("day");
  // Use specialized state for navigation to keep track independent of selection
  const [navDate, setNavDate] = useState(() => {
    // Initialize with selected date, defaultMonth, or today
    try {
      // Check if selected prop exists
      if ("selected" in props && props.selected) {
        // Handle single date selection
        if (props.selected instanceof Date) {
          return props.selected;
        }
        // Handle multiple date selection (Date[]) - use first date
        if (Array.isArray(props.selected) && props.selected.length > 0 && props.selected[0] instanceof Date) {
          return props.selected[0];
        }
        // Handle range selection - use 'from' date if available
        if (typeof props.selected === "object" && "from" in props.selected) {
          const rangeFrom = props.selected.from;
          if (rangeFrom instanceof Date) {
            return rangeFrom;
          }
        }
      }
      // Handle defaultMonth
      if ("defaultMonth" in props && props.defaultMonth instanceof Date) {
        return props.defaultMonth;
      }
    } catch {
      // Fallback to today if any type issues
    }
    return new Date();
  });

  // Sync navDate with selected prop changes
  useEffect(() => {
    // Check if selected prop exists
    if (!("selected" in props)) {
      return;
    }

    const selected = props.selected;
    if (!selected) {
      return;
    }

    let dateToNavigateTo: Date | null = null;

    // Handle single date selection
    if (selected instanceof Date) {
      dateToNavigateTo = selected;
    }
    // Handle multiple date selection (Date[]) - navigate to first date
    else if (Array.isArray(selected) && selected.length > 0 && selected[0] instanceof Date) {
      dateToNavigateTo = selected[0];
    }
    // Handle range selection - navigate to 'from' date
    else if (typeof selected === "object" && "from" in selected) {
      const rangeFrom = selected.from;
      if (rangeFrom instanceof Date) {
        dateToNavigateTo = rangeFrom;
      }
    }

    // Update navDate if month/year differs
    if (dateToNavigateTo) {
      if (
        dateToNavigateTo.getMonth() !== navDate.getMonth() ||
        dateToNavigateTo.getFullYear() !== navDate.getFullYear()
      ) {
        setNavDate(dateToNavigateTo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, ["selected" in props ? props.selected : undefined]);

  const handlePrevClick = () => {
    if (view === "day") {
      // Normalize to 1st of month to avoid day overflow (e.g., Jan 31 → Feb 31 → Mar 3)
      const newDate = new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1);
      setNavDate(newDate);
    } else if (view === "month") {
      const newDate = new Date(navDate.getFullYear() - 1, navDate.getMonth(), 1);
      setNavDate(newDate);
    } else if (view === "year") {
      const newDate = new Date(navDate.getFullYear() - 10, navDate.getMonth(), 1);
      setNavDate(newDate);
    }
  };

  const handleNextClick = () => {
    if (view === "day") {
      // Normalize to 1st of month to avoid day overflow (e.g., Jan 31 → Feb 31 → Mar 3)
      const newDate = new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1);
      setNavDate(newDate);
    } else if (view === "month") {
      const newDate = new Date(navDate.getFullYear() + 1, navDate.getMonth(), 1);
      setNavDate(newDate);
    } else if (view === "year") {
      const newDate = new Date(navDate.getFullYear() + 10, navDate.getMonth(), 1);
      setNavDate(newDate);
    }
  };

  const handleYearPrevClick = () => {
    // Set to 1st of month to avoid date edge cases (e.g., Feb 29 → Feb 28/Mar 1)
    const newDate = new Date(navDate.getFullYear() - 1, navDate.getMonth(), 1);
    setNavDate(newDate);
  };

  const handleYearNextClick = () => {
    // Set to 1st of month to avoid date edge cases (e.g., Feb 29 → Feb 28/Mar 1)
    const newDate = new Date(navDate.getFullYear() + 1, navDate.getMonth(), 1);
    setNavDate(newDate);
  };

  const handleTitleClick = () => {
    if (view === "day") setView("month");
    else if (view === "month") setView("year");
  };

  const handleMonthSelect = (monthIndex: number) => {
    // Normalize to 1st of month to avoid day overflow (e.g., selecting Feb when navDate is 31st → Mar 3)
    const newDate = new Date(navDate.getFullYear(), monthIndex, 1);
    setNavDate(newDate);
    setView("day");
  };

  const handleYearSelect = (year: number) => {
    // Normalize to 1st of month to avoid day overflow
    const newDate = new Date(year, navDate.getMonth(), 1);
    setNavDate(newDate);
    setView("month");
  };

  const handleTodayClick = () => {
    const today = new Date();
    setNavDate(today);
    setView("day");
    // We only navigate to today. Selection handles itself by user clicking the day.
  };

  // Render Month View
  if (view === "month") {
    return (
      <div className={cn("p-2 min-w-[280px]", className)}>
        <CustomHeader
          currentDate={navDate}
          onPrevClick={handlePrevClick}
          onNextClick={handleNextClick}
          onYearPrevClick={handleYearPrevClick}
          onYearNextClick={handleYearNextClick}
          onTitleClick={handleTitleClick}
          view={view}
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {MONTHS.map((month, index) => (
            <button
              type="button"
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={cn(
                "p-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-primary",
                navDate.getMonth() === index && "bg-accent-subtle text-accent-primary font-medium"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render Year View
  if (view === "year") {
    const startYear = Math.floor(navDate.getFullYear() / 10) * 10;
    // Show 12 years: startYear - 1 to startYear + 10 ?
    // Design showed faded previous/next decade years?
    // Design image 3: "2020-2029" header.
    // Body: 2019 (faded), 2020...2029 (normal), 2030 (faded).
    // Total 12 items.
    const years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i);

    return (
      <div className={cn("p-2 min-w-[280px]", className)}>
        <CustomHeader
          currentDate={navDate}
          onPrevClick={handlePrevClick}
          onNextClick={handleNextClick}
          onYearPrevClick={handleYearPrevClick}
          onYearNextClick={handleYearNextClick}
          onTitleClick={handleTitleClick}
          view={view}
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {years.map((year) => (
            <button
              type="button"
              key={year}
              onClick={() => handleYearSelect(year)}
              className={cn(
                "p-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-primary",
                navDate.getFullYear() === year && "bg-accent-subtle text-accent-primary font-medium",
                (year < startYear || year >= startYear + 10) && "text-disabled"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Omit props that would override controlled navigation/header behavior
  const {
    month: _month,
    onMonthChange: _onMonthChange,
    components: _components,
    captionLayout: _captionLayout,
    ...dayPickerProps
  } = props;

  return (
    <div className={cn("p-2 min-w-[280px]", className)}>
      <CustomHeader
        currentDate={navDate}
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
        onYearPrevClick={handleYearPrevClick}
        onYearNextClick={handleYearNextClick}
        onTitleClick={handleTitleClick}
        view={view}
      />
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="mt-2"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden", // Hide default caption
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-tertiary rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-surface-2/50 [&:has([aria-selected])]:bg-surface-2 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-colors text-primary"),
          day_selected:
            "bg-accent-primary text-on-color hover:bg-accent-primary hover:text-on-color focus:bg-accent-primary focus:text-on-color",
          day_today: "bg-surface-2 text-primary",
          day_outside:
            "day-outside text-tertiary opacity-50 aria-selected:bg-surface-2/50 aria-selected:text-tertiary aria-selected:opacity-30",
          day_disabled: "text-disabled opacity-50",
          day_range_middle: "aria-selected:!bg-accent-primary/20 aria-selected:!text-primary rounded-none",
          day_range_start: "day-range-start rounded-l-md aria-selected:bg-accent-primary aria-selected:text-on-color",
          day_range_end: "day-range-end rounded-r-md aria-selected:bg-accent-primary aria-selected:text-on-color",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...dayPickerProps}
        month={navDate}
        onMonthChange={setNavDate}
        components={{
          MonthCaption: () => <></>,
          Nav: () => <></>,
        }}
      />
      {showTodayButton && (
        <div className="mt-2 pt-2 border-t border-strong flex justify-center">
          <button
            type="button"
            onClick={handleTodayClick}
            className="text-sm font-medium text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
