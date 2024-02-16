import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
// helpers
import { renderFormattedDate, renderFormattedPayloadDate } from "./date-time.helper";
// types
import { TDurationFilterOptions, TIssuesListTypes } from "@plane/types";
// constants
import { DURATION_FILTER_OPTIONS } from "constants/dashboard";

/**
 * @description returns date range based on the duration filter
 * @param duration
 */
export const getCustomDates = (duration: TDurationFilterOptions, customDates: string[]): string => {
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
    case "custom":
      return customDates.join(",");
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

/**
 * @description returns the label for the duration filter dropdown
 * @param duration
 * @param customDates
 */
export const getDurationFilterDropdownLabel = (duration: TDurationFilterOptions, customDates: string[]): string => {
  if (duration !== "custom") return DURATION_FILTER_OPTIONS.find((option) => option.key === duration)?.label ?? "";
  else {
    const afterDate = customDates.find((date) => date.includes("after"))?.split(";")[0];
    const beforeDate = customDates.find((date) => date.includes("before"))?.split(";")[0];

    if (afterDate && beforeDate) return `${renderFormattedDate(afterDate)} - ${renderFormattedDate(beforeDate)}`;
    else if (afterDate) return `After ${renderFormattedDate(afterDate)}`;
    else if (beforeDate) return `Before ${renderFormattedDate(beforeDate)}`;
    else return "";
  }
};
