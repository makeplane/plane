/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

//
import type { ChartDataType } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
import { getCalendarSystem } from "@plane/utils"; // [FA-CUSTOM]
import { getYear as jalaliGetYear, getMonth as jalaliGetMonth, getDate as jalaliGetDate } from "date-fns-jalali"; // [FA-CUSTOM]
import { months, jalaliMonths, generateWeeks } from "../data"; // [FA-CUSTOM] added jalaliMonths
import { getNumberOfDaysBetweenTwoDates, getWeekNumberByDate } from "./helpers";
export interface IDayBlock {
  date: Date;
  day: number;
  dayNumber: number; // [FA-CUSTOM] Calendar-aware day number for display
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
  startDayNumber: number; // [FA-CUSTOM] Calendar-aware start day number
  endDayNumber: number; // [FA-CUSTOM] Calendar-aware end day number
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
const generateWeekChart = (
  weekPayload: ChartDataType,
  side: null | "left" | "right",
  targetDate?: Date,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY
) => {
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

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate, true, startOfWeek);

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

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate, true, startOfWeek);

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

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate, true, startOfWeek);

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
  shouldPopulateDaysForWeek: boolean = true,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY
): IWeekBlock[] => {
  const weeks: IWeekBlock[] = [];

  const currentDate = new Date(startDate.getTime());
  const today = new Date();

  // Adjust the current date to the start of the week
  const day = currentDate.getDay();
  const diff = (day + 7 - startOfWeek) % 7; // Calculate days to subtract to get to startOfWeek
  currentDate.setDate(currentDate.getDate() - diff);

  while (currentDate <= endDate) {
    const weekStartDate = new Date(currentDate.getTime());
    const weekEndDate = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    // [FA-CUSTOM] Calendar-aware month/year for week titles
    const isJalali = getCalendarSystem() === "jalali";
    const activeMonthList = isJalali ? jalaliMonths : months;
    const monthAtStartOfTheWeek = isJalali ? jalaliGetMonth(weekStartDate) : weekStartDate.getMonth();
    const yearAtStartOfTheWeek = isJalali ? jalaliGetYear(weekStartDate) : weekStartDate.getFullYear();
    const monthAtEndOfTheWeek = isJalali ? jalaliGetMonth(weekEndDate) : weekEndDate.getMonth();
    const yearAtEndOfTheWeek = isJalali ? jalaliGetYear(weekEndDate) : weekEndDate.getFullYear();

    const weekNumber = getWeekNumberByDate(currentDate);

    // [FA-CUSTOM] Calendar-aware day numbers for week range display
    const startDayNum = isJalali ? jalaliGetDate(weekStartDate) : weekStartDate.getDate();
    const endDayNum = isJalali ? jalaliGetDate(weekEndDate) : weekEndDate.getDate();

    weeks.push({
      children: shouldPopulateDaysForWeek ? populateDaysForWeek(weekStartDate, startOfWeek) : undefined,
      weekNumber,
      weekData: {
        shortTitle: `w${weekNumber}`,
        title: `Week ${weekNumber}`,
      },
      title:
        monthAtStartOfTheWeek === monthAtEndOfTheWeek
          ? `${activeMonthList[monthAtStartOfTheWeek].abbreviation} ${yearAtStartOfTheWeek}`
          : `${activeMonthList[monthAtStartOfTheWeek].abbreviation} ${yearAtStartOfTheWeek} - ${activeMonthList[monthAtEndOfTheWeek].abbreviation} ${yearAtEndOfTheWeek}`,
      startDayNumber: startDayNum, // [FA-CUSTOM]
      endDayNumber: endDayNum, // [FA-CUSTOM]
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
const populateDaysForWeek = (startDate: Date, startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY): IDayBlock[] => {
  const currentDate = new Date(startDate);
  const days: IDayBlock[] = [];
  const today = new Date();
  const weekDays = generateWeeks(startOfWeek);
  const isJalali = getCalendarSystem() === "jalali"; // [FA-CUSTOM]

  for (let i = 0; i < 7; i++) {
    // [FA-CUSTOM] Use Jalali day number when in Jalali mode
    const dayNumber = isJalali ? jalaliGetDate(currentDate) : currentDate.getDate();
    days.push({
      date: new Date(currentDate),
      day: currentDate.getDay(),
      dayNumber, // [FA-CUSTOM] Calendar-aware day number
      dayData: weekDays[i],
      title: `${weekDays[i].abbreviation} ${dayNumber}`,
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
