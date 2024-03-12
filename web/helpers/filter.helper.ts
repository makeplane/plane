import { differenceInCalendarDays } from "date-fns";
// types
import { IIssueFilterOptions } from "@plane/types";

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

  if (!from) {
    if (operator === "after") return date >= new Date(value);
    if (operator === "before") return date <= new Date(value);
  }

  if (from === "fromnow") {
    if (operator === "after") {
      if (value === "1_weeks") return differenceInCalendarDays(date, new Date()) >= 7;
      if (value === "2_weeks") return differenceInCalendarDays(date, new Date()) >= 14;
      if (value === "1_months") return differenceInCalendarDays(date, new Date()) >= 30;
      if (value === "2_months") return differenceInCalendarDays(date, new Date()) >= 60;
    }
  }

  return false;
};
