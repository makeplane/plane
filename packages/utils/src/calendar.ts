// plane imports
import type { ICalendarDate, ICalendarPayload } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
// local imports
import { getWeekNumberOfDate, renderFormattedPayloadDate } from "./datetime";

/**
 * @returns {ICalendarPayload} calendar payload to render the calendar
 * @param {ICalendarPayload | null} currentStructure current calendar payload
 * @param {Date} startDate date of the month to render
 * @param {EStartOfTheWeek} startOfWeek the day to start the week on
 * @description Returns calendar payload to render the calendar, if currentStructure is null, it will generate the payload for the month of startDate, else it will construct the payload for the month of startDate and append it to the currentStructure
 */
export const generateCalendarData = (
  currentStructure: ICalendarPayload | null,
  startDate: Date,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY
): ICalendarPayload => {
  const calendarData: ICalendarPayload = currentStructure ?? {};

  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();

  const currentDate = new Date(startYear, startMonth, 1);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

  // Adjust firstDayOfMonth based on startOfWeek preference
  // This calculates how many empty cells we need at the start of the calendar
  const firstDayOfMonth = (firstDayOfMonthRaw - startOfWeek + 7) % 7;

  calendarData[`y-${year}`] ||= {};
  // Always reset the month data to ensure clean regeneration with correct startOfWeek
  calendarData[`y-${year}`][`m-${month}`] = {};

  const numWeeks = Math.ceil((totalDaysInMonth + firstDayOfMonth) / 7);

  for (let week = 0; week < numWeeks; week++) {
    const currentWeekObject: { [date: string]: ICalendarDate } = {};

    const weekNumber = getWeekNumberOfDate(new Date(year, month, week * 7 - firstDayOfMonth + 1));

    for (let i = 0; i < 7; i++) {
      const dayNumber = week * 7 + i - firstDayOfMonth;

      const date = new Date(year, month, dayNumber + 1);

      const formattedDatePayload = renderFormattedPayloadDate(date);
      if (formattedDatePayload)
        currentWeekObject[formattedDatePayload] = {
          date,
          year,
          month,
          day: dayNumber + 1,
          week: weekNumber,
          is_current_month: date.getMonth() === month,
          is_current_week: getWeekNumberOfDate(date) === getWeekNumberOfDate(new Date()),
          is_today: date.toDateString() === new Date().toDateString(),
        };
    }

    // Use sequential week index instead of calculated week number for the key
    // This ensures weeks are grouped correctly regardless of startOfWeek preference
    calendarData[`y-${year}`][`m-${month}`][`w-${week}`] = currentWeekObject;
  }

  return calendarData;
};

/**
 * Returns a new array sorted by the startOfWeek.
 * @param items Array of items to sort.
 * @param getDayIndex Function to get the day index (0-6) from an item.
 * @param startOfWeek The day to start the week on.
 */
export const getOrderedDays = <T>(
  items: T[],
  getDayIndex: (item: T) => number,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY
): T[] =>
  [...items].sort((a, b) => {
    const dayA = (7 + getDayIndex(a) - startOfWeek) % 7;
    const dayB = (7 + getDayIndex(b) - startOfWeek) % 7;
    return dayA - dayB;
  });
