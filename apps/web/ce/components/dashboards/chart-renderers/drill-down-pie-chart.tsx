/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drill-down pie/donut chart renderer.
 * Supports M3: center value overlay when widget.config.center_value is true.
 * Click on a slice navigates to filtered issues.
 */

import { useCallback, useMemo } from "react";
import { PieChart as CorePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { IDashboardWidget } from "@plane/types";
import { getChartColors } from "./chart-color-utils";

interface DrillDownPieChartProps {
  widget: IDashboardWidget;
  data: Record<string, string | number>[];
  isDonut?: boolean;
  onDrillDown: (filterKey: string, filterValue: string) => void;
}

export const DrillDownPieChart = ({ widget, data, isDonut = false, onDrillDown }: DrillDownPieChartProps) => {
  const colors = getChartColors(widget.config);
  const showCenterValue = isDonut && (widget.config?.center_value as boolean);

  const total = useMemo(() => data.reduce((sum, d) => sum + ((d.count as number) || 0), 0), [data]);

  const handleSliceClick = useCallback(
    (sliceData: Record<string, string | number>) => {
      const name = sliceData?.name as string;
      if (name) onDrillDown(widget.x_axis_property, name);
    },
    [onDrillDown, widget.x_axis_property]
  );

  return (
    <div className="relative w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <CorePieChart margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
          <Pie
            data={data}
            dataKey="count"
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? "55%" : 0}
            outerRadius="75%"
            paddingAngle={isDonut ? 2 : 0}
            onClick={handleSliceClick}
            className="cursor-pointer"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip wrapperStyle={{ pointerEvents: "none" }} formatter={(value: number) => [value, "Count"]} />
        </CorePieChart>
      </ResponsiveContainer>

      {/* M3: Center value overlay for donut charts */}
      {showCenterValue && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-color-primary">{total}</span>
        </div>
      )}
    </div>
  );
};
