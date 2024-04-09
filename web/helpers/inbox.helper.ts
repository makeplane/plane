import { subDays } from "date-fns";
import { renderFormattedPayloadDate } from "./date-time.helper";

export enum EPastDurationFilters {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_7_DAYS = "last_7_days",
  LAST_30_DAYS = "last_30_days",
}

export const getCustomDates = (duration: EPastDurationFilters): string => {
  const today = new Date();
  let firstDay, lastDay;

  switch (duration) {
    case EPastDurationFilters.TODAY:
      firstDay = renderFormattedPayloadDate(today);
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    case EPastDurationFilters.YESTERDAY:
      const yesterday = subDays(today, 1);
      firstDay = renderFormattedPayloadDate(yesterday);
      lastDay = renderFormattedPayloadDate(yesterday);
      return `${firstDay};after,${lastDay};before`;
    case EPastDurationFilters.LAST_7_DAYS:
      firstDay = renderFormattedPayloadDate(subDays(today, 7));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    case EPastDurationFilters.LAST_30_DAYS:
      firstDay = renderFormattedPayloadDate(subDays(today, 30));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
  }
};

export const PAST_DURATION_FILTER_OPTIONS: {
  name: string;
  value: string;
}[] = [
  {
    name: "Today",
    value: getCustomDates(EPastDurationFilters.TODAY),
  },
  {
    name: "Yesterday",
    value: getCustomDates(EPastDurationFilters.YESTERDAY),
  },
  {
    name: "Last 7 days",
    value: getCustomDates(EPastDurationFilters.LAST_7_DAYS),
  },
  {
    name: "Last 30 days",
    value: getCustomDates(EPastDurationFilters.LAST_30_DAYS),
  },
];
