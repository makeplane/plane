import cloneDeep from "lodash/cloneDeep";
import uniqBy from "lodash/uniqBy";
//
import { months } from "../data";
import { ChartDataType } from "../types";
import { getNumberOfDaysInMonth } from "./helpers";
import { getWeeksBetweenTwoDates, IWeekBlock } from "./week-view";

export interface IMonthBlock {
  today: boolean;
  month: number;
  days: number;
  monthData: {
    key: number;
    shortTitle: string;
    title: string;
  };
  title: string;
  year: number;
}

export interface IMonthView {
  months: IMonthBlock[];
  weeks: IWeekBlock[];
}

/**
 * Generate Month Chart data
 * @param monthPayload
 * @param side
 * @returns
 */
const generateMonthChart = (monthPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = cloneDeep(monthPayload);

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: IMonthView = { months: [], weeks: [] };
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  // if side is null generate months on both side of current date
  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, currentDate.getDate());

    if (minusDate && plusDate) filteredDates = getMonthsViewBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: {
        ...renderState.data,
        startDate: filteredDates.weeks[0]?.startDate,
        endDate: filteredDates.weeks[filteredDates.weeks.length - 1]?.endDate,
      },
    };
  }
  // When side is left, generate more months on the left side of the start date
  else if (side === "left") {
    const currentDate = renderState.data.startDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);

    if (minusDate && plusDate) filteredDates = getMonthsViewBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate: filteredDates.weeks[0].startDate },
    };
  }
  // When side is right, generate more months on the right side of the end date
  else if (side === "right") {
    const currentDate = renderState.data.endDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, currentDate.getDate());

    if (minusDate && plusDate) filteredDates = getMonthsViewBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, endDate: filteredDates.weeks[filteredDates.weeks.length - 1]?.endDate },
    };
  }

  const scrollWidth = filteredDates.weeks.length * monthPayload.data.dayWidth * 7;

  return { state: renderState, payload: filteredDates, scrollWidth: scrollWidth };
};

/**
 * Get Month View data between two dates, i.e., Months and Weeks between two dates
 * @param startDate
 * @param endDate
 * @returns
 */
const getMonthsViewBetweenTwoDates = (startDate: Date, endDate: Date): IMonthView => ({
  months: getMonthsBetweenTwoDates(startDate, endDate),
  weeks: getWeeksBetweenTwoDates(startDate, endDate, false),
});

/**
 * generate array of months between two dates
 * @param startDate
 * @param endDate
 * @returns
 */
export const getMonthsBetweenTwoDates = (startDate: Date, endDate: Date): IMonthBlock[] => {
  const monthBlocks = [];

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const currentDate = new Date(startYear, startMonth);

  while (currentDate <= endDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    monthBlocks.push({
      year: currentYear,
      month: currentMonth,
      monthData: months[currentMonth],
      title: `${months[currentMonth].title} ${currentYear}`,
      days: getNumberOfDaysInMonth(currentMonth, currentYear),
      today: todayMonth === currentMonth && todayYear === currentYear,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return monthBlocks;
};

/**
 * Merge two MonthView data payloads
 * @param a
 * @param b
 * @returns
 */
const mergeMonthRenderPayloads = (a: IMonthView, b: IMonthView): IMonthView => ({
  months: uniqBy([...a.months, ...b.months], (monthBlock) => `${monthBlock.month}_${monthBlock.year}`),
  weeks: uniqBy(
    [...a.weeks, ...b.weeks],
    (weekBlock) => `${weekBlock.startDate.getTime()}_${weekBlock.endDate.getTime()}`
  ),
});

export const monthView = {
  generateChart: generateMonthChart,
  mergeRenderPayloads: mergeMonthRenderPayloads,
};
