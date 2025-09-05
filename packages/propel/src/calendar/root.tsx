"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export const Calendar = ({ className, showOutsideDays = true, ...props }: CalendarProps) => {
  const currentYear = new Date().getFullYear();
  const thirtyYearsAgoFirstDay = new Date(currentYear - 30, 0, 1);
  const thirtyYearsFromNowFirstDay = new Date(currentYear + 30, 11, 31);

  return (
    <div 
      className="text-xs bg-transparent"
      style={{
        '--rdp-cell-size': '40px',
        '--rdp-caption-font-size': '1rem',
        '--rdp-caption-navigation-size': '1.25rem',
        '--rdp-accent-color': 'rgba(var(--color-primary-100))',
        '--rdp-background-color': 'rgba(var(--color-primary-100), 0.5)',
        '--rdp-dark-background-color': 'rgba(var(--color-primary-300))',
        '--rdp-outline': '2px solid var(--rdp-accent-color)',
        '--rdp-selected-color': '#ffffff',
      } as React.CSSProperties}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          root: "relative box-border",
          day_button: cn(
            // Base button styles
            "flex overflow-hidden items-center justify-center box-border",
            "w-[var(--rdp-cell-size)] max-w-[var(--rdp-cell-size)] h-[var(--rdp-cell-size)]",
            "m-0 border-2 border-transparent rounded-full",
            // Non-disabled cursor
            "rdp-day:not(.rdp-disabled):cursor-pointer",
            // Hover states for non-disabled, non-selected
            "[.rdp-day:not(.rdp-disabled):not(.rdp-selected)_&]:hover:bg-[var(--rdp-background-color)]",
            // Focus states for non-selected, non-disabled  
            "[.rdp-day:not(.rdp-selected):not(.rdp-disabled)_&]:focus-visible:bg-[var(--rdp-background-color)]",
            // Selected state
            "[.rdp-selected_&]:bg-[var(--rdp-accent-color)] [.rdp-selected_&]:text-[var(--rdp-selected-color)] [.rdp-selected_&]:z-[1] [.rdp-selected_&]:rounded-full",
            // Selected hover state
            "[.rdp-selected_&]:hover:not(.rdp-disabled):bg-[var(--rdp-dark-background-color)]",
            // Selected focus state  
            "[.rdp-selected:not(.rdp-range_middle):not(.rdp-disabled)_&]:focus-visible:outline-[var(--rdp-outline)] [.rdp-selected:not(.rdp-range_middle):not(.rdp-disabled)_&]:focus-visible:outline-offset-2 [.rdp-selected:not(.rdp-range_middle):not(.rdp-disabled)_&]:focus-visible:outline-1 [.rdp-selected:not(.rdp-range_middle):not(.rdp-disabled)_&]:focus-visible:bg-[var(--rdp-dark-background-color)]",
            // Outside days
            "[.rdp-day.rdp-outside:not(.rdp-selected)_&]:opacity-50",
            // Disabled days
            "[.rdp-day.rdp-disabled:not(.rdp-selected)_&]:opacity-25",
            // Range middle
            "[.rdp-range_middle_&]:bg-transparent [.rdp-range_middle_&]:text-inherit",
            "[.rdp-day.rdp-range_middle_&]:hover:bg-[var(--rdp-background-color)] [.rdp-day.rdp-range_middle_&]:hover:text-inherit",
            "[.rdp-day.rdp-range_middle_&]:focus-visible:bg-[var(--rdp-background-color)] [.rdp-day.rdp-range_middle_&]:focus-visible:text-inherit"
          ),
          day: "",
          week: "m-0 p-0",
          today: cn(
            "relative",
            "[&:not(.rdp-outside)]:after:content-[''] [&:not(.rdp-outside)]:after:absolute [&:not(.rdp-outside)]:after:left-1/2 [&:not(.rdp-outside)]:after:bottom-0.5",
            "[&:not(.rdp-outside)]:after:w-2 [&:not(.rdp-outside)]:after:h-2 [&:not(.rdp-outside)]:after:bg-[var(--rdp-background-color)] [&:not(.rdp-outside)]:after:rounded-full [&:not(.rdp-outside)]:after:-translate-x-1/2"
          ),
          weekday: cn(
            "align-middle font-bold text-center h-[var(--rdp-cell-size)] p-0 uppercase",
            "text-xs"
          ),
          nav: cn(
            "box-border absolute p-inherit flex items-center",
            "top-[1.2em] right-4"
          ),
          button_next: cn(
            "border-none bg-none p-0 m-0 cursor-pointer font-inherit appearance-none",
            "inline-flex items-center justify-center relative p-1 rounded-sm",
            "w-[var(--rdp-caption-navigation-size)] h-[var(--rdp-caption-navigation-size)]",
            "hover:!bg-[rgba(var(--color-background-80))] focus-visible:!bg-[rgba(var(--color-background-80))]"
          ),
          button_previous: cn(
            "border-none bg-none p-0 m-0 cursor-pointer font-inherit appearance-none",
            "inline-flex items-center justify-center relative p-1 rounded-sm",
            "w-[var(--rdp-caption-navigation-size)] h-[var(--rdp-caption-navigation-size)]",
            "hover:!bg-[rgba(var(--color-background-80))] focus-visible:!bg-[rgba(var(--color-background-80))]"
          ),
          chevron: "fill-[rgba(var(--color-text-200))] h-3 w-3",
          dropdowns: "relative inline-flex items-center",
          dropdown: cn(
            "appearance-none absolute z-[2] top-0 bottom-0 left-0 w-full",
            "m-0 p-0 opacity-0 border-none font-inherit text-base leading-inherit cursor-pointer bg-transparent",
            "hover:!bg-[rgba(var(--color-background-80))]",
            "[&[data-disabled='true']]:opacity-100 [&[data-disabled='true']]:text-inherit"
          ),
          dropdown_root: "m-0 relative inline-flex items-center",
          months_dropdown: "capitalize",
          caption_label: cn(
            "z-[1] inline-flex items-center gap-1 m-0 px-1 whitespace-nowrap text-current",
            "border-0 border-2 border-transparent font-inherit font-semibold bg-transparent rounded",
            "text-[var(--rdp-caption-font-size)]"
          ),
          dropdown_icon: "ml-1",
          range_start: cn(
            "relative",
            "before:content-[''] before:absolute before:bg-[var(--rdp-background-color)] before:top-1/2 before:h-full before:w-1/2 before:-translate-y-1/2 before:-z-[1] before:left-1/2",
            "[&.rdp-range_end]:before:hidden"
          ),
          range_middle: "relative before:content-[''] before:absolute before:bg-[var(--rdp-background-color)] before:top-1/2 before:h-full before:w-full before:-translate-x-1/2 before:-translate-y-1/2 before:-z-[1] before:left-1/2",
          range_end: "relative before:content-[''] before:absolute before:bg-[var(--rdp-background-color)] before:top-1/2 before:h-full before:w-1/2 before:-translate-y-1/2 before:-z-[1] before:right-1/2",
          dropdown_year: "appearance-none absolute z-[2] top-0 bottom-0 left-0 w-full m-0 p-0 opacity-0 border-none font-inherit text-base leading-inherit cursor-pointer bg-transparent hover:!bg-[rgba(var(--color-background-80))] [&[data-disabled='true']]:opacity-100 [&[data-disabled='true']]:text-inherit",
        }}
        weekStartsOn={props.weekStartsOn}
        components={{
          Chevron: ({ className, ...props }) => (
            <ChevronLeft
              className={cn(
                "size-4",
                { "rotate-180": props.orientation === "right", "-rotate-90": props.orientation === "down" },
                className
              )}
              {...props}
            />
          ),
        }}
        startMonth={thirtyYearsAgoFirstDay}
        endMonth={thirtyYearsFromNowFirstDay}
        {...props}
      />
    </div>
  );
};