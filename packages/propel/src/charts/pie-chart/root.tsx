"use client";

import React, { useMemo } from "react";
import { Cell, PieChart as CorePieChart, Label, Legend, Pie, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TPieChartProps } from "@plane/types";
// local components
import { CustomPieChartTooltip } from "./tooltip";

export const PieChart = React.memo(<K extends string, T extends string>(props: TPieChartProps<K, T>) => {
  const {
    data,
    dataKey,
    cells,
    className,
    innerRadius,
    legend,
    margin,
    outerRadius,
    showTooltip = true,
    showLabel,
    centerLabel,
  } = props;

  const renderCells = useMemo(
    () => cells.map((cell) => <Cell key={cell.key} className={cell.className} fill={cell.fill} />),
    [cells]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CorePieChart
          data={data}
          margin={{
            top: margin?.top === undefined ? 5 : margin.top,
            right: margin?.right === undefined ? 30 : margin.right,
            bottom: margin?.bottom === undefined ? 5 : margin.bottom,
            left: margin?.left === undefined ? 20 : margin.left,
          }}
          accessibilityLayer
        >
          <Pie
            data={data}
            dataKey={dataKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            label={!!showLabel}
          >
            {renderCells}
            {centerLabel && (
              <Label
                value={centerLabel.text}
                fill={centerLabel.fill}
                position="center"
                style={centerLabel.style}
                className={centerLabel.className}
              />
            )}
          </Pie>
          {legend && (
            <Legend
              align={legend.align}
              verticalAlign={legend.verticalAlign}
              layout={legend.layout}
              iconSize={legend.iconSize ?? 8}
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                lineHeight: "26px",
                fontWeight: 500,
                overflow: "scroll",
                ...(legend.layout === "vertical"
                  ? {
                      maxWidth: "20%",
                      maxHeight: "90%",
                    }
                  : {
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "95%",
                      maxHeight: "20%",
                    }),
              }}
            />
          )}
          {showTooltip && (
            <Tooltip
              cursor={{ fill: "currentColor", className: "text-custom-background-90/80 cursor-pointer" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const cellData = cells.find((c) => c.key === payload[0].payload.key);
                if (!cellData) return null;
                return <CustomPieChartTooltip dotColor={cellData.fill} label={dataKey} payload={payload} />;
              }}
            />
          )}
        </CorePieChart>
      </ResponsiveContainer>
    </div>
  );
});
PieChart.displayName = "PieChart";
