import React from "react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Card, ECardSpacing } from "../../card";
import { cn } from "../../utils/classname";

type Props = {
  active: boolean | undefined;
  activeKey?: string | null;
  label: string | undefined;
  payload: Payload<ValueType, NameType>[] | undefined;
  itemKeys: string[];
  itemLabels: Record<string, string>;
  itemDotColors: Record<string, string>;
};

export const CustomTooltip = React.memo(function CustomTooltip(props: Props) {
  const { active, activeKey, label, payload, itemKeys, itemLabels, itemDotColors } = props;
  // derived values
  const filteredPayload = payload?.filter((item) => item.dataKey && itemKeys.includes(`${item.dataKey}`));

  if (!active || !filteredPayload || !filteredPayload.length) return null;

  return (
    <Card
      className="flex flex-col max-h-[40vh] w-[12rem] overflow-y-scroll vertical-scrollbar scrollbar-sm"
      spacing={ECardSpacing.SM}
    >
      <p className="flex-shrink-0 text-11 text-primary font-medium border-b border-subtle pb-2 truncate">{label}</p>
      {filteredPayload.map((item) => {
        if (!item.dataKey) return null;

        return (
          <div
            key={item?.dataKey}
            className={cn("flex items-center gap-2 text-11 transition-opacity", {
              "opacity-20": activeKey && item.dataKey !== activeKey,
            })}
          >
            <div className="flex items-center gap-2 truncate">
              {itemDotColors[item?.dataKey] && (
                <div
                  className="flex-shrink-0 size-2 rounded-xs"
                  style={{
                    backgroundColor: itemDotColors[item?.dataKey],
                  }}
                />
              )}
              <span className="text-tertiary truncate">{itemLabels[item?.dataKey]}:</span>
            </div>
            <span className="flex-shrink-0 font-medium text-secondary">{item?.value}</span>
          </div>
        );
      })}
    </Card>
  );
});
CustomTooltip.displayName = "CustomTooltip";
