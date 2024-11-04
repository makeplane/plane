//
import { weeks, months } from "../data";
import { ChartDataType } from "../types";
import { getNumberOfDaysBetweenTwoDates, getWeekNumberByDate } from "./helpers";
export interface IDayBlock {
  date: Date;
  day: number;
  dayData: {
    key: number;
    shortTitle: string;
    title: string;
    abbreviation: string;
  };
  title: string;
  today: boolean;
}

export interface IWeekBlock {
  children?: IDayBlock[];
  weekNumber: number;
  weekData: {
    shortTitle: string;
    title: string;
  };
  title: string;
  startDate: Date;
  endDate: Date;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  today: boolean;
}

/**
 * Generate Week Chart data
 * @param weekPayload
 * @param side
 * @returns
 */
const generateWeekChart = (weekPayload: ChartDataType, side: null | "left" | "right", targetDate?: Date) => {
  let renderState = weekPayload;

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: IWeekBlock[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  let startDate = new Date();
  let endDate = new Date();

  // if side is null generate weeks on both side of current date
  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, currentDate.getDate());

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);

    startDate = filteredDates[0].startDate;
    endDate = filteredDates[filteredDates.length - 1].endDate;
    renderState = {
      ...renderState,
      data: {
        ...renderState.data,
        startDate,
        endDate,
      },
    };
  }
  // When side is left, generate more weeks on the left side of the start date
  else if (side === "left") {
    const chartStartDate = renderState.data.startDate;
    const currentDate = targetDate ? targetDate : chartStartDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, 1);
    plusDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate() - 1);

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);

    startDate = filteredDates[0].startDate;
    endDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate() - 1);
    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate },
    };
  }
  // When side is right, generate more weeks on the right side of the end date
  else if (side === "right") {
    const chartEndDate = renderState.data.endDate;
    const currentDate = targetDate ? targetDate : chartEndDate;

    minusDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth(), chartEndDate.getDate() + 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, 1);

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);

    startDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth(), chartEndDate.getDate() + 1);
    endDate = filteredDates[filteredDates.length - 1].endDate;
    renderState = {
      ...renderState,
      data: { ...renderState.data, endDate },
    };
  }

  const days = Math.abs(getNumberOfDaysBetweenTwoDates(startDate, endDate)) + 1;
  const scrollWidth = days * weekPayload.data.dayWidth;

  return { state: renderState, payload: filteredDates, scrollWidth: scrollWidth };
};

/**
 * Generate weeks array between two dates
 * @param startDate
 * @param endDate
 * @param shouldPopulateDaysForWeek
 * @returns
 */
export const getWeeksBetweenTwoDates = (
  startDate: Date,
  endDate: Date,
  shouldPopulateDaysForWeek: boolean = true
): IWeekBlock[] => {
  const weeks: IWeekBlock[] = [];

  const currentDate = new Date(startDate.getTime());
  const today = new Date();

  currentDate.setDate(currentDate.getDate() - currentDate.getDay());

  while (currentDate <= endDate) {
    const weekStartDate = new Date(currentDate.getTime());
    const weekEndDate = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    const monthAtStartOfTheWeek = weekStartDate.getMonth();
    const yearAtStartOfTheWeek = weekStartDate.getFullYear();
    const monthAtEndOfTheWeek = weekEndDate.getMonth();
    const yearAtEndOfTheWeek = weekEndDate.getFullYear();

    const weekNumber = getWeekNumberByDate(currentDate);

    weeks.push({
      children: shouldPopulateDaysForWeek ? populateDaysForWeek(weekStartDate) : undefined,
      weekNumber,
      weekData: {
        shortTitle: `w${weekNumber}`,
        title: `Week ${weekNumber}`,
      },
      title:
        monthAtStartOfTheWeek === monthAtEndOfTheWeek
          ? `${months[monthAtStartOfTheWeek].abbreviation} ${yearAtStartOfTheWeek}`
          : `${months[monthAtStartOfTheWeek].abbreviation} ${yearAtStartOfTheWeek} - ${months[monthAtEndOfTheWeek].abbreviation} ${yearAtEndOfTheWeek}`,
      startMonth: monthAtStartOfTheWeek,
      startYear: yearAtStartOfTheWeek,
      endMonth: monthAtEndOfTheWeek,
      endYear: yearAtEndOfTheWeek,
      startDate: weekStartDate,
      endDate: weekEndDate,
      today: today >= weekStartDate && today <= weekEndDate ? true : false,
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

/**
 * return back array of 7 days from the date provided
 * @param startDate
 * @returns
 */
const populateDaysForWeek = (startDate: Date): IDayBlock[] => {
  const currentDate = new Date(startDate);
  const days: IDayBlock[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    days.push({
      date: new Date(currentDate),
      day: currentDate.getDay(),
      dayData: weeks[currentDate.getDay()],
      title: `${weeks[currentDate.getDay()].abbreviation} ${currentDate.getDate()}`,
      today: today.setHours(0, 0, 0, 0) == currentDate.setHours(0, 0, 0, 0),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

/**
 * Merge two Week data payloads
 * @param a
 * @param b
 * @returns
 */
const mergeWeekRenderPayloads = (a: IWeekBlock[], b: IWeekBlock[]) => [...a, ...b];

export const weekView = {
  generateChart: generateWeekChart,
  mergeRenderPayloads: mergeWeekRenderPayloads,
};
