//
import type { ChartDataType } from "@plane/types";
import { quarters } from "../data";
import { getNumberOfDaysBetweenTwoDates } from "./helpers";
import { getMonthsBetweenTwoDates, IMonthBlock } from "./month-view";

export interface IQuarterMonthBlock {
  children: IMonthBlock[];
  quarterNumber: number;
  shortTitle: string;
  title: string;
  year: number;
  today: boolean;
}

/**
 * Generate Quarter Chart data, which in turn are months in an array
 * @param quarterPayload
 * @param side
 * @returns
 */
const generateQuarterChart = (quarterPayload: ChartDataType, side: null | "left" | "right", targetDate?: Date) => {
  let renderState = quarterPayload;

  const range: number = renderState.data.approxFilterRange || 12;
  let filteredDates: IMonthBlock[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  let startDate = new Date();
  let endDate = new Date();

  // if side is null generate months on both side of current date
  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, 0);

    if (minusDate && plusDate) filteredDates = getMonthsBetweenTwoDates(minusDate, plusDate);

    const startMonthBlock = filteredDates[0];
    const endMonthBlock = filteredDates[filteredDates.length - 1];
    startDate = new Date(startMonthBlock.year, startMonthBlock.month, 1);
    endDate = new Date(endMonthBlock.year, endMonthBlock.month + 1, 0);

    renderState = {
      ...renderState,
      data: {
        ...renderState.data,
        startDate,
        endDate,
      },
    };
  }
  // When side is left, generate more months on the left side of the start date
  else if (side === "left") {
    const chartStartDate = renderState.data.startDate;
    const currentDate = targetDate ? targetDate : chartStartDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range / 2, 1);
    plusDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth() - 1, 1);

    if (minusDate && plusDate) filteredDates = getMonthsBetweenTwoDates(minusDate, plusDate);

    const startMonthBlock = filteredDates[0];
    startDate = new Date(startMonthBlock.year, startMonthBlock.month, 1);
    endDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate() - 1);
    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate },
    };
  }
  // When side is right, generate more months on the right side of the end date
  else if (side === "right") {
    const chartEndDate = renderState.data.endDate;
    const currentDate = targetDate ? targetDate : chartEndDate;

    minusDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth() + 1, 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range / 2, 1);

    if (minusDate && plusDate) filteredDates = getMonthsBetweenTwoDates(minusDate, plusDate);

    const endMonthBlock = filteredDates[filteredDates.length - 1];
    startDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth(), chartEndDate.getDate() + 1);
    endDate = new Date(endMonthBlock.year, endMonthBlock.month + 1, 0);
    renderState = {
      ...renderState,
      data: { ...renderState.data, endDate },
    };
  }

  const days = Math.abs(getNumberOfDaysBetweenTwoDates(startDate, endDate)) + 1;
  const scrollWidth = days * quarterPayload.data.dayWidth;

  return { state: renderState, payload: filteredDates, scrollWidth: scrollWidth };
};

/**
 * Merge two Quarter data payloads
 * @param a
 * @param b
 * @returns
 */
const mergeQuarterRenderPayloads = (a: IMonthBlock[], b: IMonthBlock[]) => [...a, ...b];

/**
 * Group array of Months into Quarters, returns an array og Quarters and it's children Months
 * @param monthBlocks
 * @returns
 */
export const groupMonthsToQuarters = (monthBlocks: IMonthBlock[]): IQuarterMonthBlock[] => {
  const quartersMap: { [key: string]: IQuarterMonthBlock } = {};

  const today = new Date();
  const todayQuarterNumber = Math.floor(today.getMonth() / 3);
  const todayYear = today.getFullYear();

  for (const monthBlock of monthBlocks) {
    const { month, year } = monthBlock;

    const quarterNumber = Math.floor(month / 3);

    const quarterKey = `Q${quarterNumber}-${year}`;

    if (quartersMap[quarterKey]) {
      quartersMap[quarterKey].children.push(monthBlock);
    } else {
      const quarterData = quarters[quarterNumber];
      quartersMap[quarterKey] = {
        children: [monthBlock],
        quarterNumber,
        shortTitle: quarterData.shortTitle,
        title: `${quarterData.title} ${year}`,
        year,
        today: todayQuarterNumber === quarterNumber && todayYear === year,
      };
    }
  }

  return Object.values(quartersMap);
};

export const quarterView = {
  generateChart: generateQuarterChart,
  mergeRenderPayloads: mergeQuarterRenderPayloads,
};
