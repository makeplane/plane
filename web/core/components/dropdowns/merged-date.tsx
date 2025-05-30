import React from "react";
import { format } from "date-fns";
import { observer } from "mobx-react";
// helpers
import { getDate } from "@/helpers/date-time.helper";

type Props = {
  startDate: Date | string | null | undefined;
  endDate: Date | string | null | undefined;
  className?: string;
};

/**
 * Formats merged date range display with smart formatting
 * - Single date: "Jan 24, 2025"
 * - Same year, same month: "Jan 24 - 28, 2025"
 * - Same year, different month: "Jan 24 - Feb 6, 2025"
 * - Different year: "Dec 28, 2024 - Jan 4, 2025"
 */
export const MergedDateDisplay: React.FC<Props> = observer((props) => {
  const { startDate, endDate, className = "" } = props;

  // Parse dates
  const parsedStartDate = getDate(startDate);
  const parsedEndDate = getDate(endDate);

  // Helper function to format date range
  const formatDateRange = (): string => {
    // If no dates are provided
    if (!parsedStartDate && !parsedEndDate) {
      return "";
    }

    // If only start date is provided
    if (parsedStartDate && !parsedEndDate) {
      return format(parsedStartDate, "MMM dd, yyyy");
    }

    // If only end date is provided
    if (!parsedStartDate && parsedEndDate) {
      return format(parsedEndDate, "MMM dd, yyyy");
    }

    // If both dates are provided
    if (parsedStartDate && parsedEndDate) {
      const startYear = parsedStartDate.getFullYear();
      const startMonth = parsedStartDate.getMonth();
      const endYear = parsedEndDate.getFullYear();
      const endMonth = parsedEndDate.getMonth();

      // Same year, same month
      if (startYear === endYear && startMonth === endMonth) {
        const startDay = format(parsedStartDate, "dd");
        const endDay = format(parsedEndDate, "dd");
        return `${format(parsedStartDate, "MMM")} ${startDay} - ${endDay}, ${startYear}`;
      }

      // Same year, different month
      if (startYear === endYear) {
        const startFormatted = format(parsedStartDate, "MMM dd");
        const endFormatted = format(parsedEndDate, "MMM dd");
        return `${startFormatted} - ${endFormatted}, ${startYear}`;
      }

      // Different year
      const startFormatted = format(parsedStartDate, "MMM dd, yyyy");
      const endFormatted = format(parsedEndDate, "MMM dd, yyyy");
      return `${startFormatted} - ${endFormatted}`;
    }

    return "";
  };

  const displayText = formatDateRange();

  if (!displayText) {
    return null;
  }

  return <span className={className}>{displayText}</span>;
});
