import { differenceInDays, format, formatDistanceToNow, isAfter, isValid, parseISO } from "date-fns";

// Format Date Helpers
/**
 * @returns {string | null} formatted date in the format of MMM dd, yyyy
 * @description Returns date in the formatted format
 * @param {Date | string} date
 * @example renderFormattedDate("2024-01-01") // Jan 01, 2024
 */
export const renderFormattedDate = (date: string | Date): string | null => {
  if (!date) return null;
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return null; // Return null for invalid dates
  // Format the date in format (MMM dd, yyyy)
  const formattedDate = format(parsedDate, "MMM dd, yyyy");
  return formattedDate;
};

/**
 * @returns {string} formatted date in the format of MMM dd
 * @description Returns date in the formatted format
 * @param {string | Date} date
 * @example renderShortDateFormat("2024-01-01") // Jan 01
 */
export const renderFormattedDateWithoutYear = (date: string | Date): string => {
  if (!date) return "";
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return ""; // Return empty string for invalid dates
  // Format the date in short format (MMM dd)
  const formattedDate = format(parsedDate, "MMM dd");
  return formattedDate;
};

/**
 * @returns {string | null} formatted date in the format of yyyy-mm-dd to be used in payload
 * @description Returns date in the formatted format to be used in payload
 * @param {Date | string} date
 * @example renderFormattedPayloadDate("Jan 01, 20224") // "2024-01-01"
 */
export const renderFormattedPayloadDate = (date: Date | string): string | null => {
  if (!date) return null;
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return null; // Return null for invalid dates
  // Format the date in payload format (yyyy-mm-dd)
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  return formattedDate;
};

// Format Time Helpers
/**
 * @returns {string} formatted date in the format of hh:mm a or HH:mm
 * @description Returns date in 12 hour format if in12HourFormat is true else 24 hour format
 * @param {string | Date} date
 * @param {boolean} timeFormat (optional) // default 24 hour
 * @example renderFormattedTime("2024-01-01 13:00:00") // 13:00
 * @example renderFormattedTime("2024-01-01 13:00:00", "12-hour") // 01:00 PM
 */
export const renderFormattedTime = (date: string | Date, timeFormat: "12-hour" | "24-hour" = "24-hour"): string => {
  if (!date || date === "") return "";
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // Check if the parsed date is valid
  if (!isValid(parsedDate)) return ""; // Return empty string for invalid dates
  // Format the date in 12 hour format if in12HourFormat is true
  if (timeFormat === "12-hour") {
    const formattedTime = format(parsedDate, "hh:mm a");
    return formattedTime;
  }
  // Format the date in 24 hour format
  const formattedTime = format(parsedDate, "HH:mm");
  return formattedTime;
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
  startDate: Date | string,
  endDate: Date | string,
  inclusive: boolean = true
): number => {
  if (!startDate || !endDate) return 0;
  // Parse the dates to check if they are valid
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  // Check if the parsed dates are valid before calculating the difference
  if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) return 0; // Return 0 for invalid dates
  // Calculate the difference in days
  const diffInDays = differenceInDays(parsedEndDate, parsedStartDate);
  // Return the difference in days based on inclusive flag
  return inclusive ? diffInDays + 1 : diffInDays;
};

/**
 * @returns {number} number of days left from today
 * @description Returns number of days left from today
 * @param {string | Date} date
 * @param {boolean} inclusive (optional) // default true
 * @example findHowManyDaysLeft("2024-01-01") // 3
 */
export const findHowManyDaysLeft = (date: string | Date, inclusive: boolean = true): number => {
  if (!date) return 0;
  // Pass the date to findTotalDaysInRange function to find the total number of days in range from today
  return findTotalDaysInRange(new Date(), date, inclusive);
};

// Time Difference Helpers
/**
 * @returns {string} formatted date in the form of amount of time passed since the event happened
 * @description Returns time passed since the event happened
 * @param {string | Date} time
 * @example calculateTimeAgo("2023-01-01") // 1 year ago
 */
export const calculateTimeAgo = (time: string | number | Date | null): string => {
  if (!time) return "";
  // Parse the time to check if it is valid
  const parsedTime = typeof time === "string" || typeof time === "number" ? parseISO(String(time)) : time;
  if (!parsedTime) return ""; // Return empty string for invalid dates
  // Format the time in the form of amount of time passed since the event happened
  const distance = formatDistanceToNow(parsedTime, { addSuffix: true });
  return distance;
};

// Date Validation Helpers
/**
 * @returns {string} boolean value depending on whether the date is greater than today
 * @description Returns boolean value depending on whether the date is greater than today
 * @param {string} dateStr
 * @example isDateGreaterThanToday("2024-01-01") // true
 */
export const isDateGreaterThanToday = (dateStr: string): boolean => {
  // Return false if dateStr is not present
  if (!dateStr) return false;
  // Parse the date to check if it is valid
  const date = parseISO(dateStr);
  const today = new Date();
  // Check if the parsed date is valid
  if (!isValid(date)) return false; // Return false for invalid dates
  // Return true if the date is greater than today
  return isAfter(date, today);
};

// Week Related Helpers
/**
 * @returns {number} week number of date
 * @description Returns week number of date
 * @param {Date} date
 * @example getWeekNumber(new Date("2023-09-01")) // 35
 */
export const getWeekNumberOfDate = (date: Date): number => {
  const currentDate = new Date(date);
  // Adjust the starting day to Sunday (0) instead of Monday (1)
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  // Calculate the number of days between currentDate and startDate
  const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  // Adjust the calculation for weekNumber
  const weekNumber = Math.ceil((days + 1) / 7);
  return weekNumber;
};
