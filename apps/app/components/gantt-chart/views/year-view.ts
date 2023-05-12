// types
import { ChartDataType } from "../types";
// data
import { weeks, months } from "../data";
// helpers
import {
  generateDate,
  getWeekNumberByDate,
  getNumberOfDaysInMonth,
  getWeeksBetweenTwoDates,
  getAllDatesInWeekByWeekNumber,
} from "./helpers";

export type GetAllDaysInMonthType = {
  date: any;
  day: any;
  dayData: any;
  weekNumber: number;
  title: string;
  today: boolean;
};
export const getAllDaysInMonth = (month: number, year: number) => {
  const day: GetAllDaysInMonthType[] = [];
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
      today:
        currentDate.getFullYear() === year &&
        currentDate.getMonth() === month &&
        currentDate.getDate() === _day + 1
          ? true
          : false,
    });
  });

  return day;
};

export const generateMonthDataByMonth = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;

  const monthPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    children: getAllDaysInMonth(currentMonth, currentYear),
    title: `${months[currentMonth].title} ${currentYear}`,
  };

  return monthPayload;
};

export const generateYearChart = (monthPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = monthPayload;
  const renderPayload: any = [];

  const range: number = renderState.data.approxFilterRange || 6;
  let filteredDates: number[] | Date[] = [];
  let minusDate: Date = new Date();
  let plusDate: Date = new Date();

  if (side === null) {
    const currentDate = renderState.data.currentDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - range,
      currentDate.getDate()
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + range,
      currentDate.getDate()
    );

    console.log("minusDate", minusDate);
    console.log("plusDate", plusDate);

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);
    

    console.log("filteredDates", filteredDates);

    // renderState = {
    //   ...renderState,
    //   data: {
    //     ...renderState.data,
    //     startDate: filteredDates[0],
    //     endDate: filteredDates[filteredDates.length - 1],
    //   },
    // };
  } else if (side === "left") {
    const currentDate = renderState.data.startDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - range,
      currentDate.getDate()
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      currentDate.getDate()
    );

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);

    // renderState = {
    //   ...renderState,
    //   data: { ...renderState.data, startDate: filteredDates[0] },
    // };
  } else if (side === "right") {
    const currentDate = renderState.data.endDate;

    minusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + range,
      currentDate.getDate()
    );

    if (minusDate && plusDate) filteredDates = getWeeksBetweenTwoDates(minusDate, plusDate);

    // renderState = {
    //   ...renderState,
    //   data: { ...renderState.data, endDate: filteredDates[filteredDates.length - 1] },
    // };
  }

  // if (filteredDates && filteredDates.length > 0)
  //   for (const currentDate in filteredDates) {
  //     const date = filteredDates[parseInt(currentDate)];
  //     const currentYear = date.getFullYear();
  //     const currentMonth = date.getMonth();
  //     renderPayload.push(generateMonthDataByMonth(currentMonth, currentYear));
  //   }

  const scrollWidth =
    renderPayload
      .map((monthData: any) => monthData.children.length)
      .reduce((partialSum: number, a: number) => partialSum + a, 0) * monthPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};
