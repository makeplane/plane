import React from "react";
import { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
// plane imports
import { Card, ECardSpacing } from "../../card";

type Props = {
  dotColor?: string;
  label: string;
  payload: Payload<ValueType, NameType>[];
};

export const CustomPieChartTooltip = React.memo((props: Props) => {
  const { dotColor, label, payload } = props;

  return (
    <Card
      className="flex flex-col max-h-[40vh] w-[12rem] overflow-y-scroll vertical-scrollbar scrollbar-sm"
      spacing={ECardSpacing.SM}
    >
      <p className="flex-shrink-0 text-xs text-custom-text-100 font-medium border-b border-custom-border-200 pb-2 truncate">
        {label}
      </p>
      {payload?.map((item) => (
        <div key={item?.dataKey} className="flex items-center gap-2 text-xs capitalize">
          <div className="flex items-center gap-2 truncate">
            <div
              className="flex-shrink-0 size-2 rounded-sm"
              style={{
                backgroundColor: dotColor,
              }}
            />
            <span className="text-custom-text-300 truncate">{item?.name}:</span>
          </div>
          <span className="flex-shrink-0 font-medium text-custom-text-200">{item?.value}</span>
        </div>
      ))}
    </Card>
  );
});
CustomPieChartTooltip.displayName = "CustomPieChartTooltip";
