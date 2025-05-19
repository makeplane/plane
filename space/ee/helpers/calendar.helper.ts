import { ICalendarDate, ICalendarPayload } from "../types";
import { renderFormattedPayloadDate } from "./date-time.helper";

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

export const formatDate = (date: Date, format: string): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDate = format
    .replace("dd", day.toString().padStart(2, "0"))
    .replace("d", day.toString())
    .replace("eee", daysOfWeek[date.getDay()])
    .replace("Month", monthsOfYear[month - 1])
    .replace("yyyy", year.toString())
    .replace("yyy", year.toString().slice(-3))
    .replace("hh", hours.toString().padStart(2, "0"))
    .replace("mm", minutes.toString().padStart(2, "0"))
    .replace("ss", seconds.toString().padStart(2, "0"));

  return formattedDate;
};

/**
 * @returns {ICalendarPayload} calendar payload to render the calendar
 * @param {ICalendarPayload | null} currentStructure current calendar payload
 * @param {Date} startDate date of the month to render
 * @description Returns calendar payload to render the calendar, if currentStructure is null, it will generate the payload for the month of startDate, else it will construct the payload for the month of startDate and append it to the currentStructure
 */
export const generateCalendarData = (currentStructure: ICalendarPayload | null, startDate: Date): ICalendarPayload => {
  const calendarData: ICalendarPayload = currentStructure ?? {};

  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();

  const currentDate = new Date(startYear, startMonth, 1);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

  calendarData[`y-${year}`] ||= {};
  calendarData[`y-${year}`][`m-${month}`] ||= {};

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

    calendarData[`y-${year}`][`m-${month}`][`w-${weekNumber}`] = currentWeekObject;
  }

  return calendarData;
};
