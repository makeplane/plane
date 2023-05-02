// data
import { weeks, months } from "../data";

// getting all the week Numbers in a month and year
const getWeekNumberByDate = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = firstDayOfYear.getDay();
  const firstWeekStart = firstDayOfYear.getTime() - daysOffset * 24 * 60 * 60 * 1000;

  const weekStart = new Date(firstWeekStart);
  const weekNumber =
    Math.floor((date.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber;
};

const getAllWeeksInMonth = (month: number, year: number) => {
  const weeks = [];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeek = new Date(firstDay);
  startWeek.setDate(firstDay.getDate() - firstDay.getDay());

  const endWeek = new Date(lastDay);
  endWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  while (startWeek <= endWeek) {
    const startWeekDate = new Date(startWeek);

    const endWeekDate = new Date(startWeek);
    endWeekDate.setDate(endWeekDate.getDate() + 6);

    weeks.push({
      week: getWeekNumberByDate(startWeekDate),
      start: startWeekDate,
      end: endWeekDate,
    });

    startWeek.setDate(startWeek.getDate() + 7);
  }

  return weeks;
};

export const generateDayDataByDate = (week: number) => {
  const currentWeek: number = week;
  console.log("weeks", weeks);
};

const generateWeekDataByWeek = (week: number, month: number, year: number) => {
  const currentWeek: number = week;
  const currentMonth: number = month;
  const currentYear: number = year;
};

const generateMonthDataByMonth = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;
  const allWeekData = [];

  const monthPayload = {
    year: currentYear,
    month: currentMonth,
    monthData: months[currentMonth],
    weeks: getAllWeeksInMonth(currentMonth, currentYear),
  };

  return monthPayload;
};

export const generateMonthDataByYear = (year: number) => {
  const currentYear: number = year;
  const allMonthsData = [];

  for (const month in months) {
    const currentMonth = parseInt(month);
    allMonthsData.push(generateMonthDataByMonth(currentMonth, currentYear));
  }

  return allMonthsData;
};
