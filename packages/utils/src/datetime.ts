import { format, isValid } from "date-fns";

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
    // Using Number.isInteger instead of lodash's isNumber for better specificity and no external dependency
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return;

    return new Date(year, month - 1, day);
  } catch (e) {
    return undefined;
  }
};

/**
 * @returns {string | null} formatted date in the format of MMM dd, yyyy
 * @description Returns date in the formatted format
 * @param {Date | string} date
 * @example renderFormattedDate("2024-01-01") // Jan 01, 2024
 */
export const renderFormattedDate = (date: string | Date | undefined | null): string | null => {
  // Parse the date to check if it is valid
  const parsedDate = getDate(date);
  // return if undefined
  if (!parsedDate) return null;
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return null; // Return null for invalid dates
  // Format the date in format (MMM dd, yyyy)
  const formattedDate = format(parsedDate, "MMM dd, yyyy");
  return formattedDate;
};

// Note: timeAgo function was incomplete in the original file, so it has been omitted
