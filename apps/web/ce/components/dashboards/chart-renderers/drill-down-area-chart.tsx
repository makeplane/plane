/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drill-down area chart renderer — click on a data point to navigate to filtered issues.
 */

import { useCallback } from "react";
import { AreaChart as CoreAreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { IDashboardWidget } from "@plane/types";
import { getChartColors } from "./chart-color-utils";

interface DrillDownAreaChartProps {
  widget: IDashboardWidget;
  data: Record<string, string | number>[];
  isGrouped: boolean;
  metricKeys: string[];
  onDrillDown: (filterKey: string, filterValue: string) => void;
}

export const DrillDownAreaChart = ({ widget, data, isGrouped, metricKeys, onDrillDown }: DrillDownAreaChartProps) => {
  const colors = getChartColors(widget.config);
  const areaKeys = isGrouped ? metricKeys : ["count"];

  const handleDotClick = useCallback(
    (dotData: Record<string, string | number>) => {
      const name = dotData?.name as string;
      if (name) onDrillDown(widget.x_axis_property, name);
    },
    [onDrillDown, widget.x_axis_property]
  );

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <CoreAreaChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
          <CartesianGrid stroke="var(--border-color-subtle)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--text-color-tertiary)", strokeDasharray: "4 4" }}
            wrapperStyle={{ pointerEvents: "none" }}
          />
          {areaKeys.map((key, i) => (
            <Area
              key={key}
              dataKey={key}
              stackId="s"
              fill={colors[i % colors.length]}
              stroke={colors[i % colors.length]}
              fillOpacity={0.3}
              strokeWidth={2}
              type="monotone"
              activeDot={{
                r: 6,
                cursor: "pointer",
                onClick: (_event: unknown, dotData: unknown) =>
                  handleDotClick((dotData as { payload?: Record<string, string | number> })?.payload ?? {}),
              }}
            />
          ))}
        </CoreAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
