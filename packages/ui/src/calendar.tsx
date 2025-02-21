"use client";

import { ChevronLeft } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "../helpers";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export const Calendar = ({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn("p-3", className)}
    // classNames={{
    //   months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    //   month: "space-y-4",
    //   // caption: "flex justify-center pt-1 relative items-center",
    //   // caption_label: "hidden",
    //   nav: "box-border absolute top-[1.2rem] right-[1rem] flex items-center",
    //   button_next:
    //     "size-[1.25rem] border-none bg-none p-[0.25rem] m-0 cursor-pointer inline-flex items-center justify-center relative appearance-none rounded-sm hover:bg-custom-background-80 focus-visible:bg-custom-background-80",
    //   button_previous:
    //     "size-[1.25rem] border-none bg-none p-[0.25rem] m-0 cursor-pointer inline-flex items-center justify-center relative appearance-none rounded-sm hover:bg-custom-background-80 focus-visible:bg-custom-background-80",
    //   chevron: "m-0 ml-1 size-[0.75rem]",
    //   // nav_button: cn("h-10 bg-transparent p-0 opacity-50 hover:opacity-100"),
    //   // nav_button_previous: "absolute left-1",
    //   // nav_button_next: "absolute right-1",
    //   table: "w-full border-collapse space-y-1",
    //   head_row: "flex w-full items-center",
    //   head_cell: "rounded-md w-10 text-[10px] text-center m-auto font-semibold uppercase",
    //   row: "flex w-full mt-2",
    //   cell: cn(
    //     "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-custom-primary-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-full",
    //     props.mode === "range"
    //       ? "[&:has(>.day-range-end)]:rounded-r-full [&:has(>.day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
    //       : "[&:has([aria-selected])]:rounded-full [&:has([aria-selected])]:bg-custom-primary-100 [&:has([aria-selected])]:text-white"
    //   ),
    //   // day_button:
    //   //   "size-10 flex items-center justify-center overflow-hidden box-border m-0 border-2 border-transparent rounded-full",
    //   day: "size-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-custom-primary-100/60",
    //   day_range_start: "day-range-start bg-custom-primary-100 text-white",
    //   day_range_end: "day-range-end bg-custom-primary-100 text-white",
    //   day_selected: "",
    //   day_today:
    //     "relative after:content-[''] after:absolute after:m-auto after:left-1/3  after:bottom-[6px] after:w-[6px] after:h-[6px] after:bg-custom-primary-100/50 after:rounded-full after:translate-x-1/2 after:translate-y-1/2",
    //   day_outside: "day-outside",
    //   day_disabled: "opacity-50 hover:!bg-transparent",
    //   day_range_middle: "text-black",
    //   day_hidden: "invisible",
    //   caption_dropdowns: "inline-flex bg-transparent",
    //   dropdown_root: "m-0 relative inline-flex items-center",
    //   dropdowns: "relative inline-flex items-center",
    //   dropdown:
    //     "appearance-none absolute z-[2] top-0 bottom-0 left-0 w-full m-0 p-0 opacity-0 border-none text-[1rem] cursor-pointer bg-transparent hover:bg-custom-background-80",
    //   months_dropdown: "capitalize",
    //   caption_label:
    //     "z-[1] inline-flex items-center gap-[0.25rem] m-0 py-0 px-[0.25rem] whitespace-nowrap border-2 border-transparent font-semibold bg-transparent rounded",
    //   ...classNames,
    // }}
    components={{
      Chevron: ({ className, ...props }) => (
        <ChevronLeft
          className={cn(
            "size-4",
            {
              "rotate-180": props.orientation === "right",
              "-rotate-90": props.orientation === "down",
            },
            className
          )}
          {...props}
        />
      ),
    }}
    {...props}
  />
);
