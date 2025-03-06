/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { BarChart as CoreBarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, AXIS_LABEL_CLASSNAME, TICK_LINE_CLASSNAME } from "@plane/constants";
import { TBarChartProps } from "@plane/types";
// local components
import { CustomXAxisTick, CustomYAxisTick } from "../tick";
import { CustomTooltip } from "../tooltip";
import { CustomBar } from "./bar";

export const BarChart = React.memo(<K extends string, T extends string>(props: TBarChartProps<K, T>) => {
  const {
    data,
    bars,
    xAxis,
    yAxis,
    barSize = 40,
    className,
    legend,
    margin,
    tickCount = {
      x: undefined,
      y: 10,
    },
    showTooltip = true,
  } = props;
  // derived values
  const stackKeys = useMemo(() => bars.map((bar) => bar.key), [bars]);
  const stackLabels: Record<string, string> = useMemo(
    () => bars.reduce((acc, bar) => ({ ...acc, [bar.key]: bar.label }), {}),
    [bars]
  );
  const stackDotColors = useMemo(() => bars.reduce((acc, bar) => ({ ...acc, [bar.key]: bar.fill }), {}), [bars]);
  const yAxisStrokeColor = yAxis.strokeColor ?? "rgba(var(--color-border-400))";
  const xAxisStrokeColor = xAxis.strokeColor ?? "rgba(var(--color-border-400))";

  const renderBars = useMemo(
    () =>
      bars.map((bar) => (
        <Bar
          key={bar.key}
          dataKey={bar.key}
          stackId={bar.stackId}
          fill={bar.fill}
          shape={(shapeProps: any) => (
            <CustomBar
              {...shapeProps}
              stackKeys={stackKeys}
              textClassName={bar.textClassName}
              showPercentage={bar.showPercentage}
            />
          )}
        />
      )),
    [stackKeys, bars]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreBarChart
          data={data}
          margin={{
            top: margin?.top === undefined ? 5 : margin.top,
            right: margin?.right === undefined ? 30 : margin.right,
            bottom: margin?.bottom === undefined ? 5 : margin.bottom,
            left: margin?.left === undefined ? 20 : margin.left,
          }}
          barSize={barSize}
          className="recharts-wrapper"
        >
          <XAxis
            dataKey={xAxis.key}
            tick={(props) => <CustomXAxisTick {...props} />}
            tickLine={{
              stroke: xAxisStrokeColor,
              className: TICK_LINE_CLASSNAME,
            }}
            axisLine={{
              stroke: xAxisStrokeColor,
              className: AXIS_LINE_CLASSNAME,
            }}
            label={{
              value: xAxis.label,
              dy: 28,
              className: AXIS_LABEL_CLASSNAME,
            }}
            tickCount={tickCount.x}
          />
          <YAxis
            domain={yAxis.domain}
            tickLine={{
              stroke: yAxisStrokeColor,
              className: TICK_LINE_CLASSNAME,
            }}
            axisLine={{
              stroke: yAxisStrokeColor,
              className: AXIS_LINE_CLASSNAME,
            }}
            label={{
              value: yAxis.label,
              angle: -90,
              position: "bottom",
              offset: -24,
              dx: -16,
              className: AXIS_LABEL_CLASSNAME,
            }}
            tick={(props) => <CustomYAxisTick {...props} />}
            tickCount={tickCount.y}
            allowDecimals={!!yAxis.allowDecimals}
          />
          {legend && (
            <Legend
              align={legend.align}
              verticalAlign={legend.verticalAlign}
              layout={legend.layout}
              iconSize={legend.iconSize ?? 8}
              iconType="circle"
              formatter={(value) => stackLabels[value]}
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
              content={({ active, label, payload }) => (
                <CustomTooltip
                  active={active}
                  label={label}
                  payload={payload}
                  itemKeys={stackKeys}
                  itemLabels={stackLabels}
                  itemDotColors={stackDotColors}
                />
              )}
            />
          )}
          {renderBars}
        </CoreBarChart>
      </ResponsiveContainer>
    </div>
  );
});
BarChart.displayName = "BarChart";
