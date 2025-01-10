/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// plane imports
import { Card, ECardSpacing } from "@plane/ui";
import { cn } from "@plane/utils";

type TStackedBarChartProps = {
  active: boolean | undefined;
  label: string | undefined;
  payload: any[] | undefined;
  stackKeys: string[];
  stackDotClassNames: Record<string, string>;
};

export const CustomTooltip = React.memo(
  ({ active, label, payload, stackKeys, stackDotClassNames }: TStackedBarChartProps) => {
    // derived values
    const filteredPayload = payload?.filter((item: any) => item.dataKey && stackKeys.includes(item.dataKey));

    if (!active || !filteredPayload || !filteredPayload.length) return null;
    return (
      <Card className="flex flex-col" spacing={ECardSpacing.SM}>
        <p className="text-xs text-custom-text-100 font-medium border-b border-custom-border-200 pb-2 capitalize">
          {label}
        </p>
        {filteredPayload.map((item: any) => (
          <div key={item?.dataKey} className="flex items-center gap-2 text-xs capitalize">
            {stackDotClassNames[item?.dataKey] && (
              <div className={cn("size-2 rounded-full", stackDotClassNames[item?.dataKey])} />
            )}
            <span className="text-custom-text-300">{item?.name}:</span>
            <span className="font-medium text-custom-text-200">{item?.value}</span>
          </div>
        ))}
      </Card>
    );
  }
);
CustomTooltip.displayName = "CustomTooltip";
