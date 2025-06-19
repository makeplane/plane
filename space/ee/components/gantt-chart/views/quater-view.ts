// types
import { weeks, months } from "../data";
import { ChartDataType } from "../types";
// data
// helpers
import { getDatesBetweenTwoDates, getWeeksByMonthAndYear } from "./helpers";

const generateMonthDataByMonthAndYearInMonthView = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;
  const today = new Date();

  const weeksBetweenTwoDates = getWeeksByMonthAndYear(month, year);

  const weekPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    children: weeksBetweenTwoDates.map((weekData: any) => {
      const date: Date = weekData.startDate;
      return {
        date: date,
        startDate: weekData.startDate,
        endDate: weekData.endDate,
        day: date.getDay(),
        dayData: weeks[date.getDay()],
        weekNumber: weekData.weekNumber,
        title: `W${weekData.weekNumber} (${date.getDate()})`,
        active: false,
        today: today >= weekData.startDate && today <= weekData.endDate ? true : false,
      };
    }),
    title: `${months[currentMonth].title} ${currentYear}`,
  };

  return weekPayload;
};

export const generateQuarterChart = (quarterPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = quarterPayload;
  const renderPayload: any = [];

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: Date[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, 0);

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

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);

    if (minusDate && plusDate) filteredDates = getDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate: filteredDates[0] },
    };
  } else if (side === "right") {
    const currentDate = renderState.data.endDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, 0);

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

  const scrollWidth =
    renderPayload
      .map((monthData: any) => monthData.children.length)
      .reduce((partialSum: number, a: number) => partialSum + a, 0) * quarterPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};

export const getNumberOfDaysBetweenTwoDatesInQuarter = (startDate: Date, endDate: Date) => {
  let weeksDifference: number = 0;

  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  weeksDifference = Math.floor(diffDays / 7);

  return weeksDifference;
};
