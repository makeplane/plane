import { TCalendarLayouts } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    i18n_shortTitle: string;
    i18n_title: string;
  };
} = {
  1: {
    i18n_shortTitle: "calendar.months.january.short",
    i18n_title: "calendar.months.january.full",
  },
  2: {
    i18n_shortTitle: "calendar.months.february.short",
    i18n_title: "calendar.months.february.full",
  },
  3: {
    i18n_shortTitle: "calendar.months.march.short",
    i18n_title: "calendar.months.march.full",
  },
  4: {
    i18n_shortTitle: "calendar.months.april.short",
    i18n_title: "calendar.months.april.full",
  },
  5: {
    i18n_shortTitle: "calendar.months.may.short",
    i18n_title: "calendar.months.may.full",
  },
  6: {
    i18n_shortTitle: "calendar.months.june.short",
    i18n_title: "calendar.months.june.full",
  },
  7: {
    i18n_shortTitle: "calendar.months.july.short",
    i18n_title: "calendar.months.july.full",
  },
  8: {
    i18n_shortTitle: "calendar.months.august.short",
    i18n_title: "calendar.months.august.full",
  },
  9: {
    i18n_shortTitle: "calendar.months.september.short",
    i18n_title: "calendar.months.september.full",
  },
  10: {
    i18n_shortTitle: "calendar.months.october.short",
    i18n_title: "calendar.months.october.full",
  },
  11: {
    i18n_shortTitle: "calendar.months.november.short",
    i18n_title: "calendar.months.november.full",
  },
  12: {
    i18n_shortTitle: "calendar.months.december.short",
    i18n_title: "calendar.months.december.full",
  },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    i18n_shortTitle: string;
    i18n_title: string;
  };
} = {
  1: {
    i18n_shortTitle: "calendar.days.sunday.short",
    i18n_title: "calendar.days.sunday.full",
  },
  2: {
    i18n_shortTitle: "calendar.days.monday.short",
    i18n_title: "calendar.days.monday.full",
  },
  3: {
    i18n_shortTitle: "calendar.days.tuesday.short",
    i18n_title: "calendar.days.tuesday.full",
  },
  4: {
    i18n_shortTitle: "calendar.days.wednesday.short",
    i18n_title: "calendar.days.wednesday.full",
  },
  5: {
    i18n_shortTitle: "calendar.days.thursday.short",
    i18n_title: "calendar.days.thursday.full",
  },
  6: {
    i18n_shortTitle: "calendar.days.friday.short",
    i18n_title: "calendar.days.friday.full",
  },
  7: {
    i18n_shortTitle: "calendar.days.saturday.short",
    i18n_title: "calendar.days.saturday.full",
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    i18n_title: string;
  };
} = {
  month: {
    key: "month",
    i18n_title: "calendar.layouts.month",
  },
  week: {
    key: "week",
    i18n_title: "calendar.layouts.week",
  },
};