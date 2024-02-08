import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
// helpers
import { renderFormattedPayloadDate } from "./date-time.helper";
// types
import { TDurationFilterOptions, TIssuesListTypes } from "@plane/types";

/**
 * @description returns date range based on the duration filter
 * @param duration
 */
export const getCustomDates = (duration: TDurationFilterOptions): string => {
  const today = new Date();
  let firstDay, lastDay;

  switch (duration) {
    case "none":
      return "";
    case "today":
      firstDay = renderFormattedPayloadDate(today);
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    case "this_week":
      firstDay = renderFormattedPayloadDate(startOfWeek(today));
      lastDay = renderFormattedPayloadDate(endOfWeek(today));
      return `${firstDay};after,${lastDay};before`;
    case "this_month":
      firstDay = renderFormattedPayloadDate(startOfMonth(today));
      lastDay = renderFormattedPayloadDate(endOfMonth(today));
      return `${firstDay};after,${lastDay};before`;
    case "this_year":
      firstDay = renderFormattedPayloadDate(startOfYear(today));
      lastDay = renderFormattedPayloadDate(endOfYear(today));
      return `${firstDay};after,${lastDay};before`;
  }
};

/**
 * @description returns redirection filters for the issues list
 * @param type
 */
export const getRedirectionFilters = (type: TIssuesListTypes): string => {
  const today = renderFormattedPayloadDate(new Date());

  const filterParams =
    type === "pending"
      ? "?state_group=backlog,unstarted,started"
      : type === "upcoming"
      ? `?target_date=${today};after`
      : type === "overdue"
      ? `?target_date=${today};before`
      : "?state_group=completed";

  return filterParams;
};

/**
 * @description returns the tab key based on the duration filter
 * @param duration
 * @param tab
 */
export const getTabKey = (duration: TDurationFilterOptions, tab: TIssuesListTypes | undefined): TIssuesListTypes => {
  if (!tab) return "completed";

  if (tab === "completed") return tab;

  if (duration === "none") return "pending";
  else {
    if (["upcoming", "overdue"].includes(tab)) return tab;
    else return "upcoming";
  }
};
