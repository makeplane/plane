"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "../helpers";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn("h-10 bg-transparent p-0 opacity-50 hover:opacity-100"),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full items-center",
        head_cell: "rounded-md w-10 font-normal text-[10px] text-center m-auto font-semibold uppercase",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-custom-primary-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-full",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-full [&:has(>.day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
            : "[&:has([aria-selected])]:rounded-full [&:has([aria-selected])]:bg-custom-primary-100 [&:has([aria-selected])]:text-white"
        ),
        day: cn("h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-custom-primary-100/60"),
        day_range_start: "day-range-start bg-custom-primary-100 text-white",
        day_range_end: "day-range-end bg-custom-primary-100 text-white",
        day_selected: "",
        day_today:
          "relative after:content-[''] after:absolute after:m-auto after:left-1/3  after:bottom-[6px] after:w-[6px] after:h-[6px] after:bg-custom-primary-100/50 after:rounded-full after:translate-x-1/2 after:translate-y-1/2",
        day_outside: "day-outside",
        day_disabled: "opacity-50 hover:!bg-transparent",
        day_range_middle: "text-black",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => <ChevronLeft className={cn("h-4 w-4", className)} {...props} />,
        IconRight: ({ className, ...props }) => <ChevronRight className={cn("h-4 w-4", className)} {...props} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
