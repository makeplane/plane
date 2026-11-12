/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { TooltipPopup } from "@makeplane/propel/elements/tooltip";
import { cn } from "@plane/utils";

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
    <TooltipPopup
      layout="stacked"
      render={
        <div className="vertical-scrollbar scrollbar-sm flex max-h-[40vh] w-[12rem] flex-col overflow-y-scroll" />
      }
    >
      <p className="w-full flex-shrink-0 truncate border-b border-subtle pb-2 text-caption-sm-medium text-primary">
        {label}
      </p>
      {filteredPayload.map((item) => {
        if (!item.dataKey) return null;

        return (
          <div
            key={item?.dataKey}
            className={cn("flex w-full items-center gap-2 text-caption-sm-regular transition-opacity", {
              "opacity-20": activeKey && item.dataKey !== activeKey,
            })}
          >
            <div className="flex items-center gap-2 truncate">
              {itemDotColors[item?.dataKey] && (
                <div
                  className="size-2 flex-shrink-0 rounded-xs"
                  style={{
                    backgroundColor: itemDotColors[item?.dataKey],
                  }}
                />
              )}
              <span className="truncate text-tertiary">{itemLabels[item?.dataKey]}:</span>
            </div>
            <span className="flex-shrink-0 text-caption-sm-medium text-secondary">{item?.value}</span>
          </div>
        );
      })}
    </TooltipPopup>
  );
});
CustomTooltip.displayName = "CustomTooltip";
