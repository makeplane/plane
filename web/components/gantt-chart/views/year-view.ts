// types
import { ChartDataType, IGanttBlock } from "../types";
// data
import { weeks, months } from "../data";
// helpers
import { getDatesBetweenTwoDates, getWeeksByMonthAndYear } from "./helpers";

interface IYearChild {
  active: boolean;
  date: Date;
  day: number;
  dayData: {
    key: number;
    shortTitle: string;
    title: string;
  };
  title: string;
  today: boolean;
  weekNumber: number;
}
export interface IYearBlock {
  children: IYearChild[];
  month: number;
  monthData: {
    key: number;
    shortTitle: string;
    title: string;
  };
  title: string;
  year: number;
}
[];

const generateMonthDataByMonthAndYearInMonthView = (month: number, year: number): IYearBlock => {
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

export const generateYearChart = (yearPayload: ChartDataType, side: null | "left" | "right") => {
  let renderState = yearPayload;
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
      .reduce((partialSum: number, a: number) => partialSum + a, 0) * yearPayload.data.width;

  return { state: renderState, payload: renderPayload, scrollWidth: scrollWidth };
};

export const getNumberOfDaysBetweenTwoDatesInYear = (startDate: Date, endDate: Date) => {
  let weeksDifference: number = 0;

  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  weeksDifference = Math.floor(diffDays / 7);

  return weeksDifference;
};

// calc item scroll position and width
export const getYearChartItemPositionWidthInYear = (
  chartData: ChartDataType,
  itemData: IGanttBlock
) => {
  let scrollPosition: number = 0;
  let scrollWidth: number = 0;

  const { startDate } = chartData.data;
  const { start_date: itemStartDate, target_date: itemTargetDate } = itemData;

  startDate.setHours(0, 0, 0, 0);
  itemStartDate.setHours(0, 0, 0, 0);
  itemTargetDate.setHours(0, 0, 0, 0);

  // position code starts
  const positionTimeDifference: number = startDate.getTime() - itemStartDate.getTime();
  const positionDaysDifference: number = Math.abs(
    Math.floor(positionTimeDifference / (1000 * 60 * 60 * 24))
  );
  scrollPosition = positionDaysDifference * chartData.data.width;

  var diffMonths = (itemStartDate.getFullYear() - startDate.getFullYear()) * 12;
  diffMonths -= startDate.getMonth();
  diffMonths += itemStartDate.getMonth();

  scrollPosition = scrollPosition + diffMonths;
  // position code ends

  // width code starts
  const widthTimeDifference: number = itemStartDate.getTime() - itemTargetDate.getTime();
  const widthDaysDifference: number = Math.abs(
    Math.floor(widthTimeDifference / (1000 * 60 * 60 * 24))
  );
  scrollWidth = (widthDaysDifference + 1) * chartData.data.width + 1;
  // width code ends

  return { marginLeft: scrollPosition, width: scrollWidth };
};
