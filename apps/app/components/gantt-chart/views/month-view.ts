// types
import { ChartDataType } from "../types";
// data
import { weeks, months } from "../data";

// getting all the week Numbers in a month and year
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

type GetAllWeeksInMonthType = {
  date: any;
  day: any;
  dayData: any;
  weekNumber: number;
  title: string;
};
const getAllWeeksInMonth = (month: number, year: number) => {
  const day: GetAllWeeksInMonthType[] = [];

  const numberOfDaysInMonth = getNumberOfDaysInMonth(month, year);

  Array.from(Array(numberOfDaysInMonth).keys()).map((_day: number) => {
    const date: Date = generateDate(_day, month, year);
    day.push({
      date: date,
      day: _day + 1,
      dayData: weeks[date.getDay()],
      weekNumber: getWeekNumberByDate(date),
      title: `${weeks[date.getDay()].shortTitle} ${_day + 1}`,
    });
  });

  return day;
};

const generateMonthDataByMonth = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;

  const monthPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    weeks: getAllWeeksInMonth(currentMonth, currentYear),
    title: `${months[currentMonth].title} ${currentYear}`,
  };

  return monthPayload;
};

const getDatePlusSixMonths = (date: Date) => {
  const futureDate = new Date(date.getFullYear(), date.getMonth() + 6, date.getDate());
  return futureDate;
};

const getDateMinusSixMonths = (date: Date) => {
  const pastDate = new Date(date.getFullYear(), date.getMonth() - 6, date.getDate());
  return pastDate;
};

export const generateMonthDataByYear = (
  monthPayload: ChartDataType,
  side: null | "left" | "right"
) => {
  const allMonthsData: any = [];

  if (side === null) {
    const currentDate = new Date(monthPayload.data.currentDate);
    const currentYear = currentDate.getFullYear();

    for (const month in months) {
      const currentMonth = parseInt(month);
      allMonthsData.push(generateMonthDataByMonth(currentMonth, currentYear));
    }
  } else if (side === "left") {
    monthPayload = {
      ...monthPayload,
      data: { ...monthPayload.data, previousDate: monthPayload.data.previousDate },
    };

    const currentDate = new Date(monthPayload.data.previousDate);
    const currentYear = currentDate.getFullYear();

    // for (const month in months) {
    //   const currentMonth = parseInt(month);
    //   allMonthsData.push(generateMonthDataByMonth(currentMonth, currentYear));
    // }
  } else if (side === "right") {
    monthPayload = {
      ...monthPayload,
      data: { ...monthPayload.data, nextDate: monthPayload.data.nextDate },
    };

    const currentDate = new Date(monthPayload.data.nextDate);
    const currentYear = currentDate.getFullYear();

    // for (const month in months) {
    //   const currentMonth = parseInt(month);
    //   allMonthsData.push(generateMonthDataByMonth(currentMonth, currentYear));
    // }
  }

  return allMonthsData;
};
