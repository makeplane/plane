/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { Cell, PieChart as CorePieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TPieChartProps } from "@plane/types";
import { Card, ECardSpacing } from "@plane/ui";
import { cn } from "@plane/utils";

export const PieChart = React.memo(<K extends string, T extends string>(props: TPieChartProps<K, T>) => {
  const { data, dataKey, cells, className = "w-full h-96", innerRadius, outerRadius, showTooltip = true } = props;
  // derived values
  const itemDotClassNames = useMemo(
    () => cells.reduce((acc, cell) => ({ ...acc, [cell.key]: cell.dotClassName }), {}),
    [cells]
  );

  console.log("cells", cells);
  console.log("itemDotClassNames", itemDotClassNames);

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
                return (
                  <Card className="flex flex-col" spacing={ECardSpacing.SM}>
                    <p className="text-xs text-custom-text-100 font-medium border-b border-custom-border-200 pb-2 capitalize">
                      {dataKey}
                    </p>
                    {payload?.map((item) => (
                      <div key={item?.dataKey} className="flex items-center gap-2 text-xs capitalize">
                        <div className={cn("size-2 rounded-full", cellData.dotClassName)} />
                        <span className="text-custom-text-300">{item?.name}:</span>
                        <span className="font-medium text-custom-text-200">{item?.value}</span>
                      </div>
                    ))}
                  </Card>
                );
              }}
            />
          )}
        </CorePieChart>
      </ResponsiveContainer>
    </div>
  );
});
PieChart.displayName = "PieChart";
