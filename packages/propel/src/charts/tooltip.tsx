import React from "react";
import { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
// plane imports
import { Card, ECardSpacing } from "@plane/ui";

type Props = {
  active: boolean | undefined;
  label: string | undefined;
  payload: Payload<ValueType, NameType>[] | undefined;
  itemKeys: string[];
  itemLabels: Record<string, string>;
  itemDotColors: Record<string, string>;
};

export const CustomTooltip = React.memo((props: Props) => {
  const { active, label, payload, itemKeys, itemLabels, itemDotColors } = props;
  // derived values
  const filteredPayload = payload?.filter((item) => item.dataKey && itemKeys.includes(`${item.dataKey}`));

  if (!active || !filteredPayload || !filteredPayload.length) return null;

  return (
    <Card
      className="flex flex-col max-h-[40vh] overflow-y-scroll vertical-scrollbar scrollbar-sm"
      spacing={ECardSpacing.SM}
    >
      <p className="text-xs text-custom-text-100 font-medium border-b border-custom-border-200 pb-2 capitalize">
        {label}
      </p>
      {filteredPayload.map((item) => {
        if (!item.dataKey) return null;
        return (
          <div key={item?.dataKey} className="flex items-center gap-2 text-xs">
            {itemDotColors[item?.dataKey] && (
              <div
                className="size-2 rounded-full"
                style={{
                  backgroundColor: itemDotColors[item?.dataKey],
                }}
              />
            )}
            <span className="text-custom-text-300">{itemLabels[item?.dataKey]}:</span>
            <span className="font-medium text-custom-text-200">{item?.value}</span>
          </div>
        );
      })}
    </Card>
  );
});
CustomTooltip.displayName = "CustomTooltip";
