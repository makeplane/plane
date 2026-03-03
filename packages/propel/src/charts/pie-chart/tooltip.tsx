/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
// plane imports
import { Card, ECardSpacing } from "../../card";

type Props = {
  dotColor?: string;
  label: string;
  payload: Payload<ValueType, NameType>[];
};

export const CustomPieChartTooltip = React.memo(function CustomPieChartTooltip(props: Props) {
  const { dotColor, label, payload } = props;

  return (
    <Card
      className="vertical-scrollbar flex scrollbar-sm max-h-[40vh] w-[12rem] flex-col overflow-y-scroll"
      spacing={ECardSpacing.SM}
    >
      <p className="flex-shrink-0 truncate border-b border-subtle pb-2 text-11 font-medium text-primary">{label}</p>
      {payload?.map((item) => (
        <div key={item?.dataKey} className="flex items-center gap-2 text-11 capitalize">
          <div className="flex items-center gap-2 truncate">
            <div
              className="size-2 flex-shrink-0 rounded-xs"
              style={{
                backgroundColor: dotColor,
              }}
            />
            <span className="truncate text-tertiary">{item?.name}:</span>
          </div>
          <span className="flex-shrink-0 font-medium text-secondary">{item?.value}</span>
        </div>
      ))}
    </Card>
  );
});
CustomPieChartTooltip.displayName = "CustomPieChartTooltip";
