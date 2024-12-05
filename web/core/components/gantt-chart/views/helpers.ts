import { addDaysToDate, findTotalDaysInRange, getDate } from "@/helpers/date-time.helper";
import { DEFAULT_BLOCK_WIDTH } from "../constants";
import { ChartDataType, IGanttBlock } from "../types";

/**
 * Generates Date by using Day, month and Year
 * @param day
 * @param month
 * @param year
 * @returns
 */
export const generateDate = (day: number, month: number, year: number) => new Date(year, month, day);

/**
 * Returns number of days in month
 * @param month
 * @param year
 * @returns
 */
export const getNumberOfDaysInMonth = (month: number, year: number) => {
  const date = new Date(year, month + 1, 0);

  return date.getDate();
};

/**
 * Returns week number from date
 * @param date
 * @returns
 */
export const getWeekNumberByDate = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = firstDayOfYear.getDay();

  const firstWeekStart = firstDayOfYear.getTime() - daysOffset * 24 * 60 * 60 * 1000;
  const weekStart = new Date(firstWeekStart);

  const weekNumber = Math.floor((date.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber;
};

/**
 * Returns number of days between two dates
 * @param startDate
 * @param endDate
 * @returns
 */
export const getNumberOfDaysBetweenTwoDates = (startDate: Date, endDate: Date) => {
  let daysDifference: number = 0;
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const timeDifference: number = startDate.getTime() - endDate.getTime();
  daysDifference = Math.round(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference;
};

/**
 * returns a date corresponding to the position on the timeline chart
 * @param position
 * @param chartData
 * @param offsetDays
 * @returns
 */
export const getDateFromPositionOnGantt = (position: number, chartData: ChartDataType, offsetDays = 0) => {
  const numberOfDaysSinceStart = Math.round(position / chartData.data.dayWidth) + offsetDays;

  const newDate = addDaysToDate(chartData.data.startDate, numberOfDaysSinceStart);

  if (!newDate) undefined;

  return newDate;
};

/**
 * returns the  position and width of the block on the timeline chart from startDate and EndDate
 * @param chartData
 * @param itemData
 * @returns
 */
export const getItemPositionWidth = (chartData: ChartDataType, itemData: IGanttBlock) => {
  let scrollPosition: number = 0;
  let scrollWidth: number = DEFAULT_BLOCK_WIDTH;

  const { startDate: chartStartDate } = chartData.data;
  const { start_date, target_date } = itemData;

  const itemStartDate = getDate(start_date);
  const itemTargetDate = getDate(target_date);

  chartStartDate.setHours(0, 0, 0, 0);
  itemStartDate?.setHours(0, 0, 0, 0);
  itemTargetDate?.setHours(0, 0, 0, 0);

  if (!itemStartDate && !itemTargetDate) return;

  // get scroll position from the number of days and width of each day
  scrollPosition = itemStartDate
    ? getPositionFromDate(chartData, itemStartDate, 0)
    : getPositionFromDate(chartData, itemTargetDate!, -1 * DEFAULT_BLOCK_WIDTH + chartData.data.dayWidth);

  if (itemStartDate && itemTargetDate) {
    // get width of block
    const widthTimeDifference: number = itemStartDate.getTime() - itemTargetDate.getTime();
    const widthDaysDifference: number = Math.abs(Math.floor(widthTimeDifference / (1000 * 60 * 60 * 24)));
    scrollWidth = (widthDaysDifference + 1) * chartData.data.dayWidth;
  }

  return { marginLeft: scrollPosition, width: scrollWidth };
};

export const getPositionFromDate = (chartData: ChartDataType, date: string | Date, offsetWidth: number) => {
  const currDate = getDate(date);

  const { startDate: chartStartDate } = chartData.data;

  if (!currDate || !chartStartDate) return 0;

  chartStartDate.setHours(0, 0, 0, 0);
  currDate.setHours(0, 0, 0, 0);

  // get number of days from chart start date to block's start date
  const positionDaysDifference = Math.round(findTotalDaysInRange(chartStartDate, currDate, false) ?? 0);

  if (!positionDaysDifference) return 0;

  // get scroll position from the number of days and width of each day
  return positionDaysDifference * chartData.data.dayWidth + offsetWidth;
};
