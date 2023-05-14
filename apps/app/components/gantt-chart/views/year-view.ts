// types
import { ChartDataType } from "../types";
// data
import { weeks, months } from "../data";
// helpers
import {
  getDatesBetweenTwoDates,
  getWeeksBetweenTwoDates,
  getAllDatesInWeekByWeekNumber,
} from "./helpers";

export const generateMonthDataByMonthAndYearInMonthView = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;

  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0)

  const weeksBetweenTwoDates = getWeeksBetweenTwoDates(startDate, endDate)

  const weekPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    children: weeksBetweenTwoDates.map((weekData: any) => {
      const date: Date = new Date(weekData.year, weekData.month, weekData.date)
      console.log('weekData', weekData)
      return {
        date: date,
        day: date.getDay(),
        dayData: weeks[date.getDay()],
        weekNumber: weekData.weekNumber,
        title: `Week ${weekData.weekNumber} (${weeks[date.getDay()].shortTitle} ${weekData.date})`,
        active: false ? true : false,
      }
    }),
    title: `${months[currentMonth].title} ${currentYear}`,
  };

  return weekPayload;
};

export const generateYearChart = (monthPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = monthPayload;
  const renderPayload: any = [];

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: Date[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - range,
      1
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + range,
      0
    );

    console.log('minusDate', minusDate)
    console.log('plusDate', plusDate)

    if (minusDate && plusDate) filteredDates = getDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: {
        ...renderState.data,
        startDate: filteredDates[0],
        endDate: filteredDates[filteredDates.length - 1],
      },
    };
  } else if (side === "left") {
    const currentDate = renderState.data.startDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - range,
      1
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      0
    );

    if (minusDate && plusDate) filteredDates = getDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate: filteredDates[0] },
    };
  } else if (side === "right") {
    const currentDate = renderState.data.endDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + range,
      0
    );

    if (minusDate && plusDate) filteredDates = getDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, endDate: filteredDates[filteredDates.length - 1] },
    };
  }

  if (filteredDates && filteredDates.length > 0)
    for (const currentDate in filteredDates) {
      const date = filteredDates[parseInt(currentDate)];
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth();
      renderPayload.push(generateMonthDataByMonthAndYearInMonthView(currentMonth, currentYear));
    }

  console.log('renderPayload', renderPayload)

  const scrollWidth =
    renderPayload
      .map((monthData: any) => monthData.children.length)
      .reduce((partialSum: number, a: number) => partialSum + a, 0) * monthPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};
