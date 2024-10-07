import { differenceInDays, format, formatDistanceToNow, isAfter, isEqual, isValid, parseISO } from "date-fns";
import isNumber from "lodash/isNumber";

// Format Date Helpers
/**
 * @returns {string | null} formatted date in the desired format or platform default format (MMM dd, yyyy)
 * @description Returns date in the formatted format
 * @param {Date | string} date
 * @param {string} formatToken (optional) // default MMM dd, yyyy
 * @example renderFormattedDate("2024-01-01", "MM-DD-YYYY") // Jan 01, 2024
 * @example renderFormattedDate("2024-01-01") // Jan 01, 2024
 */
export const renderFormattedDate = (
  date: string | Date | undefined | null,
  formatToken: string = "MMM dd, yyyy"
): string | null => {
  // Parse the date to check if it is valid
  const parsedDate = getDate(date);
  // return if undefined
  if (!parsedDate) return null;
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return null; // Return null for invalid dates
  let formattedDate;
  try {
    // Format the date in the format provided or default format (MMM dd, yyyy)
    formattedDate = format(parsedDate, formatToken);
  } catch (e) {
    // Format the date in format (MMM dd, yyyy) in case of any error
    formattedDate = format(parsedDate, "MMM dd, yyyy");
  }
  return formattedDate;
};

/**
 * @returns {string} formatted date in the format of MMM dd
 * @description Returns date in the formatted format
 * @param {string | Date} date
 * @example renderShortDateFormat("2024-01-01") // Jan 01
 */
export const renderFormattedDateWithoutYear = (date: string | Date): string => {
  // Parse the date to check if it is valid
  const parsedDate = getDate(date);
  // return if undefined
  if (!parsedDate) return "";
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
export const renderFormattedPayloadDate = (date: Date | string | undefined | null): string | null => {
  // Parse the date to check if it is valid
  const parsedDate = getDate(date);
  // return if undefined
  if (!parsedDate) return null;
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
  // Parse the date to check if it is valid
  const parsedDate = new Date(date);
  // return if undefined
  if (!parsedDate) return "";
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
 * @returns {number} number of days left from today
 * @description Returns number of days left from today
 * @param {string | Date} date
 * @param {boolean} inclusive (optional) // default true
 * @example findHowManyDaysLeft("2024-01-01") // 3
 */
export const findHowManyDaysLeft = (
  date: Date | string | undefined | null,
  inclusive: boolean = true
): number | undefined => {
  if (!date) return undefined;
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
  // return if undefined
  if (!parsedTime) return ""; // Return empty string for invalid dates
  // Format the time in the form of amount of time passed since the event happened
  const distance = formatDistanceToNow(parsedTime, { addSuffix: true });
  return distance;
};

export function calculateTimeAgoShort(date: string | number | Date | null): string {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();
  const diffInSeconds = (now.getTime() - parsedDate.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return `${Math.floor(diffInSeconds)}s`;
  }

  const diffInMinutes = diffInSeconds / 60;
  if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m`;
  }

  const diffInHours = diffInMinutes / 60;
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  }

  const diffInDays = diffInHours / 24;
  if (diffInDays < 30) {
    return `${Math.floor(diffInDays)}d`;
  }

  const diffInMonths = diffInDays / 30;
  if (diffInMonths < 12) {
    return `${Math.floor(diffInMonths)}mo`;
  }

  const diffInYears = diffInMonths / 12;
  return `${Math.floor(diffInYears)}y`;
}

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
  const currentDate = date;
  // Adjust the starting day to Sunday (0) instead of Monday (1)
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  // Calculate the number of days between currentDate and startDate
  const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  // Adjust the calculation for weekNumber
  const weekNumber = Math.ceil((days + 1) / 7);
  return weekNumber;
};

/**
 * @returns {boolean} boolean value depending on whether the dates are equal
 * @description Returns boolean value depending on whether the dates are equal
 * @param date1
 * @param date2
 * @example checkIfDatesAreEqual("2024-01-01", "2024-01-01") // true
 * @example checkIfDatesAreEqual("2024-01-01", "2024-01-02") // false
 */
export const checkIfDatesAreEqual = (
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined
): boolean => {
  const parsedDate1 = getDate(date1);
  const parsedDate2 = getDate(date2);
  // return if undefined
  if (!parsedDate1 && !parsedDate2) return true;
  if (!parsedDate1 || !parsedDate2) return false;

  return isEqual(parsedDate1, parsedDate2);
};

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

export const isInDateFormat = (date: string) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(date);
};

/**
 * returns the date string in ISO format regardless of the timezone in input date string
 * @param dateString
 * @returns
 */
export const convertToISODateString = (dateString: string | undefined) => {
  if (!dateString) return dateString;

  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * returns the date string in Epoch regardless of the timezone in input date string
 * @param dateString
 * @returns
 */
export const convertToEpoch = (dateString: string | undefined) => {
  if (!dateString) return dateString;

  const date = new Date(dateString);
  return date.getTime();
};

/**
 * get current Date time in UTC ISO format
 * @returns
 */
export const getCurrentDateTimeInISO = () => {
  const date = new Date();
  return date.toISOString();
};

/**
 * @description converts hours and minutes to minutes
 * @param { number } hours
 * @param { number } minutes
 * @returns { number } minutes
 * @example convertHoursMinutesToMinutes(2, 30) // Output: 150
 */
export const convertHoursMinutesToMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;

/**
 * @description converts minutes to hours and minutes
 * @param { number } mins
 * @returns { number, number } hours and minutes
 * @example convertMinutesToHoursAndMinutes(150) // Output: { hours: 2, minutes: 30 }
 */
export const convertMinutesToHoursAndMinutes = (mins: number): { hours: number; minutes: number } => {
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);

  return { hours: hours, minutes: minutes };
};

/**
 * @description converts minutes to hours and minutes string
 * @param { number } totalMinutes
 * @returns { string } 0h 0m
 * @example convertMinutesToHoursAndMinutes(150) // Output: 2h 10m
 */
export const convertMinutesToHoursMinutesString = (totalMinutes: number): string => {
  const { hours, minutes } = convertMinutesToHoursAndMinutes(totalMinutes);

  return `${hours ? `${hours}h ` : ``}${minutes ? `${minutes}m ` : ``}`;
};

/**
 * @description calculates the read time for a document using the words count
 * @param {number} wordsCount
 * @returns {number} total number of seconds
 * @example getReadTimeFromWordsCount(400) // Output: 120
 * @example getReadTimeFromWordsCount(100) // Output: 30s
 */
export const getReadTimeFromWordsCount = (wordsCount: number): number => {
  const wordsPerMinute = 200;
  const minutes = wordsCount / wordsPerMinute;
  return minutes * 60;
};

/**
 * @description generates an array of dates between the start and end dates
 * @param startDate
 * @param endDate
 * @returns
 */
export const generateDateArray = (startDate: string | Date, endDate: string | Date) => {
  // Convert the start and end dates to Date objects if they aren't already
  const start = new Date(startDate);
  // start.setDate(start.getDate() + 1);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);

  // Create an empty array to store the dates
  const dateArray = [];

  // Use a while loop to generate dates between the range
  while (start <= end) {
    // Increment the date by 1 day (86400000 milliseconds)
    start.setDate(start.getDate() + 1);
    // Push the current date (converted to ISO string for consistency)
    dateArray.push({
      date: new Date(start).toISOString().split("T")[0],
    });
  }

  return dateArray;
};
