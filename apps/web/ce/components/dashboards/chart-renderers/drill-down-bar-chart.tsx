/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drill-down bar chart renderer — wraps propel BarChart and adds per-bar click navigation.
 * Also supports M1: horizontal orientation via layout prop.
 * Recharts Bar component fires native click events that bubble to the container.
 * We intercept the synthetic React onClick at the outermost div and resolve the
 * clicked group name from the tooltip-payload stored in the SVG element's React fiber.
 */

import { useCallback } from "react";
import { BarChart as CoreBarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { IDashboardWidget } from "@plane/types";
import { getChartColors } from "./chart-color-utils";

interface DrillDownBarChartProps {
  widget: IDashboardWidget;
  data: Record<string, string | number>[];
  isGrouped: boolean;
  metricKeys: string[];
  onDrillDown: (filterKey: string, filterValue: string) => void;
}

export const DrillDownBarChart = ({ widget, data, isGrouped, metricKeys, onDrillDown }: DrillDownBarChartProps) => {
  const colors = getChartColors(widget.config);
  const barKeys = isGrouped ? metricKeys : ["count"];
  // M1: horizontal orientation — recharts uses layout="vertical" for horizontal bars
  const isHorizontal = (widget.config?.orientation as string) === "horizontal";
  const layout = isHorizontal ? "vertical" : "horizontal";

  const handleBarClick = useCallback(
    (barData: Record<string, string | number>) => {
      const name = barData?.name as string;
      if (name) onDrillDown(widget.x_axis_property, name);
    },
    [onDrillDown, widget.x_axis_property]
  );

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <CoreBarChart data={data} layout={layout} margin={{ top: 5, right: 30, bottom: 5, left: 20 }} barSize={40}>
          <CartesianGrid stroke="var(--border-color-subtle)" vertical={false} />
          {isHorizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            </>
          )}
          <Tooltip cursor={{ fill: "var(--alpha-black-300)" }} wrapperStyle={{ pointerEvents: "none" }} />
          {barKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              stackId={isHorizontal ? undefined : "s"}
              onClick={handleBarClick}
              className="cursor-pointer"
            />
          ))}
        </CoreBarChart>
      </ResponsiveContainer>
    </div>
  );
};
