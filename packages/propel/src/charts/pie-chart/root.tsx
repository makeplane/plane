"use client";

import React, { useMemo } from "react";
import { Cell, PieChart as CorePieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TPieChartProps } from "@plane/types";
// local components
import { CustomPieChartTooltip } from "./tooltip";

export const PieChart = React.memo(<K extends string, T extends string>(props: TPieChartProps<K, T>) => {
  const { data, dataKey, cells, className = "w-full h-96", innerRadius, outerRadius, showTooltip = true } = props;

  const renderCells = useMemo(
    () => cells.map((cell) => <Cell key={cell.key} className={cell.className} style={cell.style} />),
    [cells]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CorePieChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <Pie data={data} dataKey={dataKey} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}>
            {renderCells}
          </Pie>
          {showTooltip && (
            <Tooltip
              cursor={{ fill: "currentColor", className: "text-custom-background-90/80 cursor-pointer" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const cellData = cells.find((c) => c.key === payload[0].name);
                if (!cellData) return null;
                return <CustomPieChartTooltip dotClassName={cellData.dotClassName} label={dataKey} payload={payload} />;
              }}
            />
          )}
        </CorePieChart>
      </ResponsiveContainer>
    </div>
  );
});
PieChart.displayName = "PieChart";
