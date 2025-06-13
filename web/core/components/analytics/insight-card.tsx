// plane package imports
import React, { useMemo } from "react";
import { IAnalyticsResponseFields } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import TrendPiece from "./trend-piece";

export type InsightCardProps = {
  data?: IAnalyticsResponseFields;
  label: string;
  isLoading?: boolean;
  versus?: string | null;
};

const InsightCard = (props: InsightCardProps) => {
  const { data, label, isLoading, versus } = props;
  const { count, filter_count } = data || {};
  const percentage = useMemo(() => {
    if (count != null && filter_count != null) {
      const result = ((count - filter_count) / count) * 100;
      const isFiniteAndNotNaNOrZero = Number.isFinite(result) && !Number.isNaN(result) && result !== 0;
      return isFiniteAndNotNaNOrZero ? result : null;
    }
    return null;
  }, [count, filter_count]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-custom-text-300">{label}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-custom-text-100">{count}</div>
          {/* {percentage && (
            <div className="flex gap-1 text-xs text-custom-text-300">
              <TrendPiece percentage={percentage} size="xs" />
              {versus && <div>vs {versus}</div>}
            </div>
          )} */}
        </div>
      ) : (
        <Loader.Item height="50px" width="100%" />
      )}
    </div>
  );
};

export default InsightCard;
