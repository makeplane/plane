import React, { useMemo } from "react";
import { ArrowRight, Calendar, CalendarClock } from "lucide-react";
import { Card, ECardSpacing } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
import TrendPiece from "@/components/analytics/trend-piece";

export interface ICycleModuleTooltipProps {
  title: string;
  startDate?: string;
  endDate?: string;
  completionPercentage?: number;
  rows: { label: string; value: string | number }[];
  totalCount: number;
  completedCount: number;
}

const ModulesCyclesTooltip = ({
  title,
  startDate,
  endDate,
  rows,
  totalCount,
  completedCount,
}: ICycleModuleTooltipProps) => {
  const completionPercentage = useMemo(() => {
    // Edge case 1: Both are 0
    if (completedCount === 0 || totalCount === 0) return 0;

    // Edge case 3: Completed is greater than total (shouldn't happen in normal cases)
    if (completedCount > totalCount) return 100;

    // Edge case 4: Negative values (shouldn't happen in normal cases)
    if (completedCount < 0 || totalCount < 0) return 0;

    // Normal case: Calculate percentage
    return (completedCount / totalCount) * 100;
  }, [completedCount, totalCount]);

  return (
    <Card
      className="flex flex-col max-h-[40vh] w-[14rem] overflow-y-scroll vertical-scrollbar scrollbar-sm gap-2"
      spacing={ECardSpacing.SM}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div>{title}</div>
          <TrendPiece percentage={completionPercentage} size="xs" trendIconVisible={false} variant="tinted" />
        </div>
        <div className="flex items-center gap-2  opacity-50 ">
          <CalendarClock className="w-3 h-3" />
          <div className="flex gap-1  text-xs">
            {renderFormattedDate(startDate) ?? "-"}
            <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
            {renderFormattedDate(endDate) ?? "-"}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-xs text-text-300">
            <div>{row.label}</div>
            <div>{row.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ModulesCyclesTooltip;
