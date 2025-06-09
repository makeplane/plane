import { subDays } from "date-fns";
// plane imports
import { EPastDurationFilters } from "@plane/constants";
// local imports
import { renderFormattedPayloadDate } from "./datetime";

export const getCustomDates = (duration: EPastDurationFilters): string => {
  const today = new Date();
  let firstDay, lastDay;

  switch (duration) {
    case EPastDurationFilters.TODAY: {
      firstDay = renderFormattedPayloadDate(today);
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.YESTERDAY: {
      const yesterday = subDays(today, 1);
      firstDay = renderFormattedPayloadDate(yesterday);
      lastDay = renderFormattedPayloadDate(yesterday);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.LAST_7_DAYS: {
      firstDay = renderFormattedPayloadDate(subDays(today, 7));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.LAST_30_DAYS: {
      firstDay = renderFormattedPayloadDate(subDays(today, 30));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
  }
};
