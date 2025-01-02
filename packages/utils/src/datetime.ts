import { differenceInDays, format, formatDistanceToNow, isAfter, isEqual, isValid, parseISO } from "date-fns";

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
/**
 * @description Returns date in the formatted format
 * @param {Date | string} date Date to format
 * @param {string} formatToken Format token (optional, default: MMM dd, yyyy)
 * @returns {string | undefined} Formatted date in the desired format
 * @example
 * renderFormattedDate("2024-01-01") // returns "Jan 01, 2024"
 * renderFormattedDate("2024-01-01", "MM-DD-YYYY") // returns "01-01-2024"
 */
export const renderFormattedDate = (
  date: string | Date | undefined | null,
  formatToken: string = "MMM dd, yyyy"
): string | undefined => {
  // Parse the date to check if it is valid
  const parsedDate = getDate(date);
  // return if undefined
  if (!parsedDate) return;
  // Check if the parsed date is valid before formatting
  if (!isValid(parsedDate)) return; // Return undefined for invalid dates
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
 * @description Returns total number of days in range
 * @param {string | Date} startDate - Start date
 * @param {string | Date} endDate - End date
 * @param {boolean} inclusive - Include start and end dates (optional, default: true)
 * @returns {number | undefined} Total number of days
 * @example
 * findTotalDaysInRange("2024-01-01", "2024-01-08") // returns 8
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
 * @description Add number of days to the provided date
 * @param {string | Date} startDate - Start date
 * @param {number} numberOfDays - Number of days to add
 * @returns {Date | undefined} Resulting date
 * @example
 * addDaysToDate("2024-01-01", 7) // returns Date(2024-01-08)
 */
export const addDaysToDate = (startDate: Date | string | undefined | null, numberOfDays: number): Date | undefined => {
  // Parse the dates to check if they are valid
  const parsedStartDate = getDate(startDate);
  // return if undefined
  if (!parsedStartDate) return;
  const newDate = new Date(parsedStartDate);
  newDate.setDate(newDate.getDate() + numberOfDays);
  return newDate;
};

/**
 * @description Returns number of days left from today
 * @param {string | Date} date - Target date
 * @param {boolean} inclusive - Include today (optional, default: true)
 * @returns {number | undefined} Number of days left
 * @example
 * findHowManyDaysLeft("2024-01-08") // returns days between today and Jan 8, 2024
 */
export const findHowManyDaysLeft = (
  date: Date | string | undefined | null,
  inclusive: boolean = true
): number | undefined => {
  if (!date) return undefined;
  return findTotalDaysInRange(new Date(), date, inclusive);
};

/**
 * @description Returns time passed since the event happened
 * @param {string | number | Date} time - Time to calculate from
 * @returns {string} Formatted time ago string
 * @example
 * calculateTimeAgo("2023-01-01") // returns "1 year ago"
 */
export const calculateTimeAgo = (time: string | number | Date | null): string => {
  if (!time) return "";
  const parsedTime = typeof time === "string" || typeof time === "number" ? parseISO(String(time)) : time;
  if (!parsedTime) return "";
  const distance = formatDistanceToNow(parsedTime, { addSuffix: true });
  return distance;
};

/**
 * @description Returns short form of time passed (e.g., 1y, 2mo, 3d)
 * @param {string | number | Date} date - Date to calculate from
 * @returns {string} Short form time ago
 * @example
 * calculateTimeAgoShort("2023-01-01") // returns "1y"
 */
export const calculateTimeAgoShort = (date: string | number | Date | null): string => {
  if (!date) return "";

  const parsedDate = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();
  const diffInSeconds = (now.getTime() - parsedDate.getTime()) / 1000;

  if (diffInSeconds < 60) return `${Math.floor(diffInSeconds)}s`;
  const diffInMinutes = diffInSeconds / 60;
  if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
  const diffInHours = diffInMinutes / 60;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
  const diffInDays = diffInHours / 24;
  if (diffInDays < 30) return `${Math.floor(diffInDays)}d`;
  const diffInMonths = diffInDays / 30;
  if (diffInMonths < 12) return `${Math.floor(diffInMonths)}mo`;
  const diffInYears = diffInMonths / 12;
  return `${Math.floor(diffInYears)}y`;
};

/**
 * @description Checks if a date is greater than today
 * @param {string} dateStr - Date string to check
 * @returns {boolean} True if date is greater than today
 * @example
 * isDateGreaterThanToday("2024-12-31") // returns true
 */
export const isDateGreaterThanToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  const today = new Date();
  if (!isValid(date)) return false;
  return isAfter(date, today);
};

/**
 * @description Returns week number of date
 * @param {Date} date - Date to get week number from
 * @returns {number} Week number (1-52)
 * @example
 * getWeekNumberOfDate(new Date("2023-09-01")) // returns 35
 */
export const getWeekNumberOfDate = (date: Date): number => {
  const currentDate = date;
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + 1) / 7);
  return weekNumber;
};

/**
 * @description Checks if two dates are equal
 * @param {Date | string} date1 - First date
 * @param {Date | string} date2 - Second date
 * @returns {boolean} True if dates are equal
 * @example
 * checkIfDatesAreEqual("2024-01-01", "2024-01-01") // returns true
 */
export const checkIfDatesAreEqual = (
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined
): boolean => {
  const parsedDate1 = getDate(date1);
  const parsedDate2 = getDate(date2);
  if (!parsedDate1 && !parsedDate2) return true;
  if (!parsedDate1 || !parsedDate2) return false;
  return isEqual(parsedDate1, parsedDate2);
};

/**
 * @description Checks if a string matches date format YYYY-MM-DD
 * @param {string} date - Date string to check
 * @returns {boolean} True if string matches date format
 * @example
 * isInDateFormat("2024-01-01") // returns true
 */
export const isInDateFormat = (date: string): boolean => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(date);
};

/**
 * @description Converts date string to ISO format
 * @param {string} dateString - Date string to convert
 * @returns {string | undefined} ISO date string
 * @example
 * convertToISODateString("2024-01-01") // returns "2024-01-01T00:00:00.000Z"
 */
export const convertToISODateString = (dateString: string | undefined): string | undefined => {
  if (!dateString) return dateString;
  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * @description Converts date string to epoch timestamp
 * @param {string} dateString - Date string to convert
 * @returns {number | undefined} Epoch timestamp
 * @example
 * convertToEpoch("2024-01-01") // returns 1704067200000
 */
export const convertToEpoch = (dateString: string | undefined): number | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return date.getTime();
};

/**
 * @description Gets current date time in ISO format
 * @returns {string} Current date time in ISO format
 * @example
 * getCurrentDateTimeInISO() // returns "2024-01-01T12:00:00.000Z"
 */
export const getCurrentDateTimeInISO = (): string => {
  const date = new Date();
  return date.toISOString();
};

/**
 * @description Converts hours and minutes to total minutes
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {number} Total minutes
 * @example
 * convertHoursMinutesToMinutes(2, 30) // returns 150
 */
export const convertHoursMinutesToMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;

/**
 * @description Converts total minutes to hours and minutes
 * @param {number} mins - Total minutes
 * @returns {{ hours: number; minutes: number }} Hours and minutes
 * @example
 * convertMinutesToHoursAndMinutes(150) // returns { hours: 2, minutes: 30 }
 */
export const convertMinutesToHoursAndMinutes = (mins: number): { hours: number; minutes: number } => {
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  return { hours, minutes };
};

/**
 * @description Converts minutes to hours and minutes string
 * @param {number} totalMinutes - Total minutes
 * @returns {string} Formatted string (e.g., "2h 30m")
 * @example
 * convertMinutesToHoursMinutesString(150) // returns "2h 30m"
 */
export const convertMinutesToHoursMinutesString = (totalMinutes: number): string => {
  const { hours, minutes } = convertMinutesToHoursAndMinutes(totalMinutes);
  return `${hours ? `${hours}h ` : ``}${minutes ? `${minutes}m ` : ``}`;
};

/**
 * @description Calculates read time in seconds from word count
 * @param {number} wordsCount - Number of words
 * @returns {number} Read time in seconds
 * @example
 * getReadTimeFromWordsCount(400) // returns 120
 */
export const getReadTimeFromWordsCount = (wordsCount: number): number => {
  const wordsPerMinute = 200;
  const minutes = wordsCount / wordsPerMinute;
  return minutes * 60;
};

/**
 * @description Generates array of dates between start and end dates
 * @param {string | Date} startDate - Start date
 * @param {string | Date} endDate - End date
 * @returns {Array<{ date: string }>} Array of dates
 * @example
 * generateDateArray("2024-01-01", "2024-01-03")
 * // returns [{ date: "2024-01-02" }, { date: "2024-01-03" }]
 */
export const generateDateArray = (startDate: string | Date, endDate: string | Date): Array<{ date: string }> => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);

  const dateArray = [];
  while (start <= end) {
    start.setDate(start.getDate() + 1);
    dateArray.push({
      date: new Date(start).toISOString().split("T")[0],
    });
  }
  return dateArray;
};
