// types
import { ChartDataType } from "../types";
// data
import { weeks, months } from "../data";
// helpers
import { generateDate, getWeekNumberByDate, getNumberOfDaysInMonth, getDatesBetweenTwoDates } from "./helpers";

type GetAllDaysInMonthInMonthViewType = {
  date: any;
  day: any;
  dayData: any;
  weekNumber: number;
  title: string;
  active: boolean;
  today: boolean;
};
const getAllDaysInMonthInMonthView = (month: number, year: number) => {
  const day: GetAllDaysInMonthInMonthViewType[] = [];
  const numberOfDaysInMonth = getNumberOfDaysInMonth(month, year);
  const currentDate = new Date();

  Array.from(Array(numberOfDaysInMonth).keys()).map((_day: number) => {
    const date: Date = generateDate(_day + 1, month, year);
    day.push({
      date: date,
      day: _day + 1,
      dayData: weeks[date.getDay()],
      weekNumber: getWeekNumberByDate(date),
      title: `${weeks[date.getDay()].shortTitle} ${_day + 1}`,
      active: false,
      today:
        currentDate.getFullYear() === year && currentDate.getMonth() === month && currentDate.getDate() === _day + 1
          ? true
          : false,
    });
  });

  return day;
};

const generateMonthDataByMonthAndYearInMonthView = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;

  const monthPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    children: getAllDaysInMonthInMonthView(currentMonth, currentYear),
    title: `${months[currentMonth].title} ${currentYear}`,
  };

  return monthPayload;
};

export const generateBiWeekChart = (monthPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = monthPayload;
  const renderPayload: any = [];

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: Date[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, currentDate.getDate());

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

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - range, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());

    if (minusDate && plusDate) filteredDates = getDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate: filteredDates[0] },
    };
  } else if (side === "right") {
    const currentDate = renderState.data.endDate;

    minusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    plusDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + range, currentDate.getDate());

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
      .reduce((partialSum: number, a: number) => partialSum + a, 0) * monthPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};

export const getNumberOfDaysBetweenTwoDatesInBiWeek = (startDate: Date, endDate: Date) => {
  let daysDifference: number = 0;
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const timeDifference: number = startDate.getTime() - endDate.getTime();
  daysDifference = Math.abs(Math.floor(timeDifference / (1000 * 60 * 60 * 24)));

  return daysDifference;
};
