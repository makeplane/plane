import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
// helpers
import { renderFormattedPayloadDate } from "./date-time.helper";
// types
import { TDurationFilterOptions } from "@plane/types";

export const getCustomDates = (duration: TDurationFilterOptions): string => {
  const today = new Date();
  let firstDay, lastDay;

  switch (duration) {
    case "today":
      firstDay = renderFormattedPayloadDate(today);
      lastDay = renderFormattedPayloadDate(today);
      console.log("duration", `${firstDay};after,${lastDay};before`);
    case "this_week":
      firstDay = renderFormattedPayloadDate(startOfWeek(today));
      lastDay = renderFormattedPayloadDate(endOfWeek(today));
    case "this_month":
      firstDay = renderFormattedPayloadDate(startOfMonth(today));
      lastDay = renderFormattedPayloadDate(endOfMonth(today));
    case "this_year":
      firstDay = renderFormattedPayloadDate(startOfYear(today));
      lastDay = renderFormattedPayloadDate(endOfYear(today));
  }

  return `${firstDay};after,${lastDay};before`;
};
