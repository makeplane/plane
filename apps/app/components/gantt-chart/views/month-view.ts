// types
import { ChartDataType } from "../types";
// data
import { weeks, months } from "../data";

export const getWeekNumberByDate = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = firstDayOfYear.getDay();

  const firstWeekStart = firstDayOfYear.getTime() - daysOffset * 24 * 60 * 60 * 1000;
  const weekStart = new Date(firstWeekStart);

  const weekNumber =
    Math.floor((date.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber;
};

export const getNumberOfDaysInMonth = (month: number, year: number) => {
  const date = new Date(year, month, 1);

  date.setMonth(date.getMonth() + 1);
  date.setDate(date.getDate() - 1);

  return date.getDate();
};

export const generateDate = (day: number, month: number, year: number) =>
  new Date(year, month, day);

export const getMonthDatesBetweenTwoDates = (startDate: Date, endDate: Date) => {
  const months = [];

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  const currentDate = new Date(startYear, startMonth);

  while (currentDate <= endDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    months.push(new Date(currentYear, currentMonth));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  if (endYear === currentDate.getFullYear() && endMonth === currentDate.getMonth())
    months.push(endDate);

  return months;
};

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

  Array.from(Array(numberOfDaysInMonth).keys()).map((_day: number) => {
    const date: Date = generateDate(_day, month, year);
    day.push({
      date: date,
      day: _day + 1,
      dayData: weeks[date.getDay()],
      weekNumber: getWeekNumberByDate(date),
      title: `${weeks[date.getDay()].shortTitle} ${_day + 1}`,
      today: false,
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

export const generateMonthDataByYear = (
  monthPayload: ChartDataType,
  side: null | "left" | "right"
) => {
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
      currentDate.getDate()
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + range,
      currentDate.getDate()
    );

    if (minusDate && plusDate) filteredDates = getMonthDatesBetweenTwoDates(minusDate, plusDate);

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
      currentDate.getDate()
    );
    plusDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      currentDate.getDate()
    );

    if (minusDate && plusDate) filteredDates = getMonthDatesBetweenTwoDates(minusDate, plusDate);

    renderState = {
      ...renderState,
      data: { ...renderState.data, startDate: filteredDates[0] },
    };
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

    if (minusDate && plusDate) filteredDates = getMonthDatesBetweenTwoDates(minusDate, plusDate);

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
      renderPayload.push(generateMonthDataByMonth(currentMonth, currentYear));
    }

  const scrollWidth = ((renderPayload.map((monthData: any) => monthData.children.length)).reduce((partialSum: number, a: number) => partialSum + a, 0)) * monthPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};

export const setMonthChartItemPosition = (chartData: ChartDataType, itemData: any) => {
  let scrollPosition: number = 0;
  const { startDate } = chartData.data;
  const { start_date: itemStartDate } = itemData;

  startDate.setHours(0, 0, 0, 0);
  itemStartDate.setHours(0, 0, 0, 0);

  const timeDifference: number = startDate.getTime() - itemStartDate.getTime();
  const daysDifference: number = Math.abs(Math.floor((timeDifference / (1000 * 60 * 60 * 24))));
  scrollPosition = (daysDifference * chartData.data.width);

  return scrollPosition;
};

export const setMonthChartItemWidth = (chartData: ChartDataType, itemData: any,) => {
  let scrollWidth: number = 0;
  const { start_date: itemStartDate, target_date: itemTargetDate } = itemData;

  itemStartDate.setHours(0, 0, 0, 0);
  itemTargetDate.setHours(0, 0, 0, 0);

  const timeDifference: number = itemStartDate.getTime() - itemTargetDate.getTime();
  const daysDifference: number = Math.abs(Math.floor((timeDifference / (1000 * 60 * 60 * 24))));
  scrollWidth = (daysDifference * chartData.data.width);

  return scrollWidth;
};