// plane package imports
import React from "react";
import { IAnalyticsResponseFields } from "@plane/types";
import { Loader } from "@plane/ui";

export type InsightCardProps = {
  data?: IAnalyticsResponseFields;
  label: string;
  isLoading?: boolean;
};

const InsightCard = (props: InsightCardProps) => {
  const { data, label, isLoading = false } = props;
  const count = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-custom-text-300">{label}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-custom-text-100">{count}</div>
        </div>
      ) : (
        <Loader.Item height="50px" width="100%" />
      )}
    </div>
  );
};

export default InsightCard;
