/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drill-down line chart renderer — supports M2 line_type (solid/dashed/stepped)
 * and click-to-navigate drill-down on data points.
 */

import { useCallback } from "react";
import { LineChart as CoreLineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { IDashboardWidget } from "@plane/types";
import { getChartColors } from "./chart-color-utils";

/** Map line_type config to recharts Line props */
const getLineProps = (lineType?: string): { strokeDasharray?: string; type: "monotone" | "linear" | "step" } => {
  switch (lineType) {
    case "dashed":
      return { strokeDasharray: "6 4", type: "monotone" };
    case "stepped":
      return { type: "step" };
    default:
      return { type: "monotone" };
  }
};

interface DrillDownLineChartProps {
  widget: IDashboardWidget;
  data: Record<string, string | number>[];
  isGrouped: boolean;
  metricKeys: string[];
  onDrillDown: (filterKey: string, filterValue: string) => void;
}

export const DrillDownLineChart = ({ widget, data, isGrouped, metricKeys, onDrillDown }: DrillDownLineChartProps) => {
  const colors = getChartColors(widget.config);
  const lineKeys = isGrouped ? metricKeys : ["count"];
  const lineType = widget.config?.line_type as string | undefined;
  const lineProps = getLineProps(lineType);

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
        <CoreLineChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
          <CartesianGrid stroke="var(--border-color-subtle)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--text-color-tertiary)", strokeDasharray: "4 4" }}
            wrapperStyle={{ pointerEvents: "none" }}
          />
          {lineKeys.map((key, i) => (
            <Line
              key={key}
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              type={lineProps.type}
              strokeDasharray={lineProps.strokeDasharray}
              dot={{ fill: colors[i % colors.length], fillOpacity: 1, r: 4, cursor: "pointer" }}
              activeDot={{
                r: 6,
                cursor: "pointer",
                onClick: (_event: unknown, dotData: unknown) =>
                  handleDotClick((dotData as { payload?: Record<string, string | number> })?.payload ?? {}),
              }}
            />
          ))}
        </CoreLineChart>
      </ResponsiveContainer>
    </div>
  );
};
