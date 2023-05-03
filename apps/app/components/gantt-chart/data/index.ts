// types
import { ChartDataType } from "../types";

// constants
export const weeks = [
  { week: 0, shortTitle: "sun", title: "sunday" },
  { week: 1, shortTitle: "mon", title: "monday" },
  { week: 2, shortTitle: "tue", title: "tuesday" },
  { week: 3, shortTitle: "wed", title: "wednesday" },
  { week: 4, shortTitle: "thurs", title: "thursday" },
  { week: 5, shortTitle: "fri", title: "friday" },
  { week: 6, shortTitle: "sat", title: "saturday" },
];

export const months = [
  { month: 0, shortTitle: "jan", title: "january" },
  { month: 1, shortTitle: "feb", title: "february" },
  { month: 2, shortTitle: "mar", title: "march" },
  { month: 3, shortTitle: "apr", title: "april" },
  { month: 4, shortTitle: "may", title: "may" },
  { month: 5, shortTitle: "jun", title: "june" },
  { month: 6, shortTitle: "jul", title: "july" },
  { month: 7, shortTitle: "aug", title: "august" },
  { month: 8, shortTitle: "sept", title: "september" },
  { month: 9, shortTitle: "oct", title: "october" },
  { month: 10, shortTitle: "nov", title: "november" },
  { month: 11, shortTitle: "dec", title: "december" },
];

// context data
export const allViewsWithData: ChartDataType[] = [
  {
    key: "hours",
    title: "Hours",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40,
    },
  },
  {
    key: "days",
    title: "Days",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40,
    },
  },
  {
    key: "week",
    title: "Week",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40, // it will preview week dates with weekends highlighted with 1 week limitations ex: title (Wed 1, Thu 2, Fri 3)
    },
  },
  {
    key: "bi_week",
    title: "Bi-Week",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40, // it will preview monthly all dates with weekends highlighted with 3 week limitations ex: title (Wed 1, Thu 2, Fri 3)
    },
  },
  {
    key: "month",
    title: "Month",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40, // it will preview monthly all dates with weekends highlighted with no limitations ex: title (1, 2, 3)
    },
  },
  {
    key: "quarter",
    title: "Quarter",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 100, // it will preview week starting dates all months data and there is 3 months limitation for preview ex: title (2, 9, 16, 23, 30)
    },
  },
  {
    key: "year",
    title: "Year",
    data: {
      previousDate: new Date(),
      currentDate: new Date(),
      nextDate: new Date(),
      approxRange: 4,
      width: 40, // it will preview week starting dates all months data and there is no limitation for preview ex: title (2, 9, 16, 23, 30)
    },
  },
];

export const currentViewDataWithView = (view: string | undefined) => {
  let currentView = null;
  currentView = view != undefined && allViewsWithData.find((_viewData) => _viewData.key === view);
  return currentView;
};
