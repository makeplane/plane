import React, { useMemo, useState } from "react";
import { Cell, PieChart as CorePieChart, Label, Legend, Pie, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import type { TPieChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomActiveShape } from "./active-shape";
import { CustomPieChartTooltip } from "./tooltip";

export const PieChart = React.memo(function PieChart<K extends string, T extends string>(props: TPieChartProps<K, T>) {
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
    tooltipLabel,
  } = props;
  // states
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  const renderCells = useMemo(
    () =>
      cells.map((cell, index) => (
        <Cell
          key={cell.key}
          className="transition-opacity duration-200"
          fill={cell.fill}
          opacity={!!activeLegend && activeLegend !== cell.key ? 0.1 : 1}
          style={{
            outline: "none",
          }}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        />
      )),
    [activeLegend, cells]
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
                      className="text-sm font-medium transition-opacity duration-200"
                      cx={props.cx}
                      cy={props.cy}
                      x={props.x}
                      y={props.y}
                      textAnchor={props.textAnchor}
                      dominantBaseline={props.dominantBaseline}
                      fill="var(--text-color-secondary)"
                      opacity={!!activeLegend && activeLegend !== payload.key ? 0.1 : 1}
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
                opacity={activeLegend ? 0.1 : 1}
                style={centerLabel.style}
                className={centerLabel.className}
              />
            )}
          </Pie>
          {legend && (
            // @ts-expect-error recharts types are not up to date
            <Legend
              onMouseEnter={(payload) => {
                // @ts-expect-error recharts types are not up to date
                const key: string | undefined = payload.payload?.key;
                if (!key) return;
                setActiveLegend(key);
                setActiveIndex(null);
              }}
              onMouseLeave={() => setActiveLegend(null)}
              {...getLegendProps(legend)}
            />
          )}
          {showTooltip && (
            <Tooltip
              cursor={{
                fill: "currentColor",
                className: "bg-layer-1-hover cursor-pointer",
              }}
              wrapperStyle={{
                pointerEvents: "none",
              }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const cellData = cells.find((c) => c.key === payload[0].payload.key);
                if (!cellData) return null;
                const label = tooltipLabel
                  ? typeof tooltipLabel === "function"
                    ? tooltipLabel(payload[0]?.payload?.payload)
                    : tooltipLabel
                  : dataKey;
                return <CustomPieChartTooltip dotColor={cellData.fill} label={label} payload={payload} />;
              }}
            />
          )}
        </CorePieChart>
      </ResponsiveContainer>
    </div>
  );
});
PieChart.displayName = "PieChart";
