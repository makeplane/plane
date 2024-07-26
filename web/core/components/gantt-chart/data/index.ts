// types
import { WeekMonthDataType, ChartDataType, TGanttViews } from "../types";

// constants
export const weeks: WeekMonthDataType[] = [
  { key: 0, shortTitle: "sun", title: "sunday" },
  { key: 1, shortTitle: "mon", title: "monday" },
  { key: 2, shortTitle: "tue", title: "tuesday" },
  { key: 3, shortTitle: "wed", title: "wednesday" },
  { key: 4, shortTitle: "thurs", title: "thursday" },
  { key: 5, shortTitle: "fri", title: "friday" },
  { key: 6, shortTitle: "sat", title: "saturday" },
];

export const months: WeekMonthDataType[] = [
  { key: 0, shortTitle: "jan", title: "january" },
  { key: 1, shortTitle: "feb", title: "february" },
  { key: 2, shortTitle: "mar", title: "march" },
  { key: 3, shortTitle: "apr", title: "april" },
  { key: 4, shortTitle: "may", title: "may" },
  { key: 5, shortTitle: "jun", title: "june" },
  { key: 6, shortTitle: "jul", title: "july" },
  { key: 7, shortTitle: "aug", title: "august" },
  { key: 8, shortTitle: "sept", title: "september" },
  { key: 9, shortTitle: "oct", title: "october" },
  { key: 10, shortTitle: "nov", title: "november" },
  { key: 11, shortTitle: "dec", title: "december" },
];

export const charCapitalize = (word: string) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`;

export const bindZero = (value: number) => (value > 9 ? `${value}` : `0${value}`);

export const timePreview = (date: Date) => {
  let hours = date.getHours();
  const amPm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  let minutes: number | string = date.getMinutes();
  minutes = bindZero(minutes);

  return `${bindZero(hours)}:${minutes} ${amPm}`;
};

export const datePreview = (date: Date, includeTime: boolean = false) => {
  const day = date.getDate();
  let month: number | WeekMonthDataType = date.getMonth();
  month = months[month as number] as WeekMonthDataType;
  const year = date.getFullYear();

  return `${charCapitalize(month?.shortTitle)} ${day}, ${year}${includeTime ? `, ${timePreview(date)}` : ``}`;
};

// context data
export const VIEWS_LIST: ChartDataType[] = [
  // {
  //   key: "hours",
  //   title: "Hours",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 4,
  //     width: 40,
  //   },
  // },
  // {
  //   key: "days",
  //   title: "Days",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 4,
  //     width: 40,
  //   },
  // },
  // {
  //   key: "week",
  //   title: "Week",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 4,
  //     width: 180, // it will preview week dates with weekends highlighted with 1 week limitations ex: title (Wed 1, Thu 2, Fri 3)
  //   },
  // },
  // {
  //   key: "bi_week",
  //   title: "Bi-Week",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 4,
  //     width: 100, // it will preview monthly all dates with weekends highlighted with 3 week limitations ex: title (Wed 1, Thu 2, Fri 3)
  //   },
  // },
  {
    key: "month",
    title: "Month",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 6,
      width: 55, // it will preview monthly all dates with weekends highlighted with no limitations ex: title (1, 2, 3)
    },
  },
  // {
  //   key: "quarter",
  //   title: "Quarter",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 12,
  //     width: 100, // it will preview week starting dates all months data and there is 3 months limitation for preview ex: title (2, 9, 16, 23, 30)
  //   },
  // },
  // {
  //   key: "year",
  //   title: "Year",
  //   data: {
  //     startDate: new Date(),
  //     currentDate: new Date(),
  //     endDate: new Date(),
  //     approxFilterRange: 10,
  //     width: 80, // it will preview week starting dates all months data and there is no limitation for preview ex: title (2, 9, 16, 23, 30)
  //   },
  // },
];

export const currentViewDataWithView = (view: TGanttViews = "month") =>
  VIEWS_LIST.find((_viewData) => _viewData.key === view);
