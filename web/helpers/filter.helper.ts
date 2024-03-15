// types
import { IIssueFilterOptions } from "@plane/types";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { getDate } from "./date-time.helper";

export const calculateTotalFilters = (filters: IIssueFilterOptions): number =>
  filters && Object.keys(filters).length > 0
    ? Object.keys(filters)
        .map((key) =>
          filters[key as keyof IIssueFilterOptions] !== null
            ? isNaN((filters[key as keyof IIssueFilterOptions] as string[]).length)
              ? 0
              : (filters[key as keyof IIssueFilterOptions] as string[]).length
            : 0
        )
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
