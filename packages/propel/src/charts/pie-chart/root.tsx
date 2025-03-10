"use client";

import React, { useMemo, useState } from "react";
import { Cell, PieChart as CorePieChart, Label, Legend, Pie, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TPieChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomActiveShape } from "./active-shape";
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
    customLabel,
    centerLabel,
    cornerRadius,
    paddingAngle,
  } = props;
  // states
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const renderCells = useMemo(
    () =>
      cells.map((cell, index) => (
        <Cell
          key={cell.key}
          className={cell.className}
          fill={cell.fill}
          style={{
            outline: "none",
          }}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        />
      )),
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
        >
          <Pie
            activeIndex={activeIndex === null ? undefined : activeIndex}
            onMouseLeave={() => setActiveIndex(null)}
            data={data}
            dataKey={dataKey}
            cx="50%"
            cy="50%"
            blendStroke
            activeShape={<CustomActiveShape />}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            cornerRadius={cornerRadius}
            paddingAngle={paddingAngle}
            labelLine={false}
            label={
              showLabel
                ? ({ payload, ...props }) => (
                    <text
                      className="text-sm font-medium"
                      cx={props.cx}
                      cy={props.cy}
                      x={props.x}
                      y={props.y}
                      textAnchor={props.textAnchor}
                      dominantBaseline={props.dominantBaseline}
                      fill="rgba(var(--color-text-200))"
                    >
                      {customLabel?.(payload.count) ?? payload.count}
                    </text>
                  )
                : undefined
            }
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
            // @ts-expect-error recharts types are not up to date
            <Legend {...getLegendProps(legend)} />
          )}
          {showTooltip && (
            <Tooltip
              cursor={{
                fill: "currentColor",
                className: "text-custom-background-90/80 cursor-pointer",
              }}
              wrapperStyle={{
                pointerEvents: "auto",
              }}
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
