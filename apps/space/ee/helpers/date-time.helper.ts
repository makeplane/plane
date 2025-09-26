import { differenceInDays, format, isValid } from "date-fns";
import { isNumber } from "lodash-es";

/**
 * This method returns a date from string of type yyyy-mm-dd
 * This method is recommended to use instead of new Date() as this does not introduce any timezone offsets
 * @param date
 * @returns date or undefined
 */
export const getDate = (date: string | Date | undefined | null): Date | undefined => {
  try {
    if (!date || date === "") return;

    if (typeof date !== "string" && !(date instanceof String)) return date;

    const [yearString, monthString, dayString] = date.substring(0, 10).split("-");
    const year = parseInt(yearString);
    const month = parseInt(monthString);
    const day = parseInt(dayString);
    if (!isNumber(year) || !isNumber(month) || !isNumber(day)) return;

    return new Date(year, month - 1, day);
  } catch (e) {
    return undefined;
  }
};

// Date Difference Helpers
/**
 * @returns {number} total number of days in range
 * @description Returns total number of days in range
 * @param {string} startDate
 * @param {string} endDate
 * @param {boolean} inclusive
 * @example checkIfStringIsDate("2021-01-01", "2021-01-08") // 8
 */
export const findTotalDaysInRange = (
  startDate: Date | string | undefined | null,
  endDate: Date | string | undefined | null,
  inclusive: boolean = true
): number | undefined => {
  // Parse the dates to check if they are valid
  const parsedStartDate = getDate(startDate);
  const parsedEndDate = getDate(endDate);
  // return if undefined
  if (!parsedStartDate || !parsedEndDate) return;
  // Check if the parsed dates are valid before calculating the difference
  if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) return 0; // Return 0 for invalid dates
  // Calculate the difference in days
  const diffInDays = differenceInDays(parsedEndDate, parsedStartDate);
  // Return the difference in days based on inclusive flag
  return inclusive ? diffInDays + 1 : diffInDays;
};

/**
 * @returns {string | null} formatted date in the format of yyyy-mm-dd to be used in payload
 * @description Returns date in the formatted format to be used in payload
 * @param {Date | string} date
 * @example renderFormattedPayloadDate("Jan 01, 20224") // "2024-01-01"
 */
export const renderFormattedPayloadDate = (date: Date | string | undefined | null): string | null => {
  if (!date) return null;
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // return if undefined
  if (!parsedDate) return null;
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return null; // Return null for invalid dates
  // Format the date in payload format (yyyy-mm-dd)
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  return formattedDate;
};
