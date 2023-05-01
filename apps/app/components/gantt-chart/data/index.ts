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
export const allViewsWithData = [
  { title: "Hours", key: "hours", data: null },
  { title: "Days", key: "days", data: null },
  { title: "Week", key: "week", data: null },
  { title: "Bi-Week", key: "bi_week", data: null },
  { title: "Month", key: "month", data: null },
  {
    title: "Quarter",
    key: "quarter",
    data: {
      // month wise week start date render (break year in to week wise data)
    },
  },
  {
    title: "Year",
    key: "year",
    data: {
      // month wise week start date render (break year in to week wise data)
    },
  },
];

const dummyIssues = [
  {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  },
];
