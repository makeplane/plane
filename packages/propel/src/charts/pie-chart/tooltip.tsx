import React from "react";
import { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
// plane imports
import { Card, ECardSpacing } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  dotClassName?: string;
  label: string;
  payload: Payload<ValueType, NameType>[];
};

export const CustomPieChartTooltip = React.memo((props: Props) => {
  const { dotClassName, label, payload } = props;

  return (
    <Card className="flex flex-col" spacing={ECardSpacing.SM}>
      <p className="text-xs text-custom-text-100 font-medium border-b border-custom-border-200 pb-2 capitalize">
        {label}
      </p>
      {payload?.map((item) => (
        <div key={item?.dataKey} className="flex items-center gap-2 text-xs capitalize">
          <div className={cn("size-2 rounded-full", dotClassName)} />
          <span className="text-custom-text-300">{item?.name}:</span>
          <span className="font-medium text-custom-text-200">{item?.value}</span>
        </div>
      ))}
    </Card>
  );
});
CustomPieChartTooltip.displayName = "CustomPieChartTooltip";
