import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    shortTitle: string;
    title: string;
  };
} = {
  1: {
    shortTitle: "Jan",
    title: "January",
  },
  2: {
    shortTitle: "Feb",
    title: "February",
  },
  3: {
    shortTitle: "Mar",
    title: "March",
  },
  4: {
    shortTitle: "Apr",
    title: "April",
  },
  5: {
    shortTitle: "May",
    title: "May",
  },
  6: {
    shortTitle: "Jun",
    title: "June",
  },
  7: {
    shortTitle: "Jul",
    title: "July",
  },
  8: {
    shortTitle: "Aug",
    title: "August",
  },
  9: {
    shortTitle: "Sep",
    title: "September",
  },
  10: {
    shortTitle: "Oct",
    title: "October",
  },
  11: {
    shortTitle: "Nov",
    title: "November",
  },
  12: {
    shortTitle: "Dec",
    title: "December",
  },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    shortTitle: string;
    title: string;
    value: EStartOfTheWeek;
  };
} = {
  1: {
    shortTitle: "Sun",
    title: "Sunday",
    value: EStartOfTheWeek.SUNDAY,
  },
  2: {
    shortTitle: "Mon",
    title: "Monday",
    value: EStartOfTheWeek.MONDAY,
  },
  3: {
    shortTitle: "Tue",
    title: "Tuesday",
    value: EStartOfTheWeek.TUESDAY,
  },
  4: {
    shortTitle: "Wed",
    title: "Wednesday",
    value: EStartOfTheWeek.WEDNESDAY,
  },
  5: {
    shortTitle: "Thu",
    title: "Thursday",
    value: EStartOfTheWeek.THURSDAY,
  },
  6: {
    shortTitle: "Fri",
    title: "Friday",
    value: EStartOfTheWeek.FRIDAY,
  },
  7: {
    shortTitle: "Sat",
    title: "Saturday",
    value: EStartOfTheWeek.SATURDAY,
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    title: string;
  };
} = {
  month: {
    key: "month",
    title: "Month layout",
  },
  week: {
    key: "week",
    title: "Week layout",
  },
};
