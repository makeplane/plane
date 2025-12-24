import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeftIcon } from "../icons/arrows/chevron-left";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  const currentYear = new Date().getFullYear();
  const thirtyYearsAgoFirstDay = new Date(currentYear - 30, 0, 1);
  const thirtyYearsFromNowFirstDay = new Date(currentYear + 30, 11, 31);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      weekStartsOn={props.weekStartsOn}
      components={{
        Chevron: ({ className, ...props }) => (
          <ChevronLeftIcon
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
  );
}
