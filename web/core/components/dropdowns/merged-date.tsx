import React from "react";
import { observer } from "mobx-react";
// helpers
import { formatDateRange, getDate } from "@plane/utils";

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

  const displayText = formatDateRange(parsedStartDate, parsedEndDate);

  if (!displayText) {
    return null;
  }

  return <span className={className}>{displayText}</span>;
});
