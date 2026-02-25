/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { format as gregorianFormat, isValid } from "date-fns";
// [FA-CUSTOM] Jalali calendar support
import { format as jalaliFormat } from "date-fns-jalali";
import { isNumber } from "lodash-es";

// [FA-CUSTOM] Module-level calendar system state for Space app
let _spaceCalendarSystem: "gregorian" | "jalali" = "gregorian";
let activeFormat = gregorianFormat;

export const setSpaceCalendarSystem = (system: "gregorian" | "jalali") => {
  _spaceCalendarSystem = system;
  activeFormat = system === "jalali" ? jalaliFormat : gregorianFormat;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const timeAgo = (time: any) => {
  switch (typeof time) {
    case "number":
      break;
    case "string":
      time = +new Date(time);
      break;
    case "object":
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
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
  } catch (_err) {
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
  const formattedDate = activeFormat(parsedDate, "MMM dd, yyyy"); // [FA-CUSTOM] calendar-aware
  return formattedDate;
};
