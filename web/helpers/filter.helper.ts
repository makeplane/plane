import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
// helpers
import { getDate } from "./date-time.helper";
// import { IIssueFilterOptions } from "@plane/types";

/**
 * @description calculates the total number of filters applied
 * @param {T} filters
 * @returns {number}
 */
export const calculateTotalFilters = <T>(filters: T): number =>
  filters && Object.keys(filters).length > 0
    ? Object.keys(filters)
        .map((key) => {
          const value = filters[key as keyof T];
          if (value === null) return 0;
          if (Array.isArray(value)) return value.length;
          if (typeof value === "boolean") return value ? 1 : 0;
          return 0;
        })
        .reduce((curr, prev) => curr + prev, 0)
    : 0;
/**
 * @description checks if the date satisfies the filter
 * @param {Date} date
 * @param {string} filter
 * @returns {boolean}
 */
export const satisfiesDateFilter = (date: Date, filter: string): boolean => {
  const [value, operator, from] = filter.split(";");

  const dateValue = getDate(value);

  if (operator === "custom" && from === "custom") {
    if (value === "today") return differenceInCalendarDays(date, new Date()) === 0;
    if (value === "yesterday") return differenceInCalendarDays(date, new Date()) === -1;
    if (value === "last_7_days") return differenceInCalendarDays(date, new Date()) >= -7;
    if (value === "last_30_days") return differenceInCalendarDays(date, new Date()) >= -30;
  }

  if (!from && dateValue) {
    if (operator === "after") return date >= dateValue;
    if (operator === "before") return date <= dateValue;
  }

  if (from === "fromnow") {
    if (operator === "before") {
      if (value === "1_weeks") return differenceInCalendarDays(date, new Date()) <= -7;
      if (value === "2_weeks") return differenceInCalendarDays(date, new Date()) <= -14;
      if (value === "1_months") return differenceInCalendarDays(date, new Date()) <= -30;
    }

    if (operator === "after") {
      if (value === "1_weeks") return differenceInCalendarDays(date, new Date()) >= 7;
      if (value === "2_weeks") return differenceInCalendarDays(date, new Date()) >= 14;
      if (value === "1_months") return differenceInCalendarDays(date, new Date()) >= 30;
      if (value === "2_months") return differenceInCalendarDays(date, new Date()) >= 60;
    }
  }

  return false;
};
