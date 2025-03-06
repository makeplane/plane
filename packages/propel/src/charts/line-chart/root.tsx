/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { LineChart as CoreLineChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, AXIS_LABEL_CLASSNAME, TICK_LINE_CLASSNAME } from "@plane/constants";
import { TLineChartProps } from "@plane/types";
// local components
import { CustomXAxisTick, CustomYAxisTick } from "../tick";
import { CustomTooltip } from "../tooltip";

export const LineChart = React.memo(<K extends string, T extends string>(props: TLineChartProps<K, T>) => {
  const {
    data,
    lines,
    margin,
    xAxis,
    yAxis,
    className,
    tickCount = {
      x: undefined,
      y: 10,
    },
    legend,
    showTooltip = true,
  } = props;
  // derived values
  const itemKeys = useMemo(() => lines.map((line) => line.key), [lines]);
  const itemLabels: Record<string, string> = useMemo(
    () => lines.reduce((acc, line) => ({ ...acc, [line.key]: line.label }), {}),
    [lines]
  );
  const itemDotColors = useMemo(() => lines.reduce((acc, line) => ({ ...acc, [line.key]: line.stroke }), {}), [lines]);
  const yAxisStrokeColor = yAxis.strokeColor ?? "rgba(var(--color-border-400))";
  const xAxisStrokeColor = xAxis.strokeColor ?? "rgba(var(--color-border-400))";

  const renderLines = useMemo(
    () =>
      lines.map((line) => (
        <Line
          key={line.key}
          dataKey={line.key}
          type={line.smoothCurves ? "monotone" : "linear"}
          className={line.className}
          fill={line.fill}
          stroke={line.stroke}
          strokeDasharray={line.dashedLine ? "4 4" : "none"}
          dot={line.showDot}
        />
      )),
    [lines]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreLineChart
          data={data}
          margin={{
            top: margin?.top === undefined ? 5 : margin.top,
            right: margin?.right === undefined ? 30 : margin.right,
            bottom: margin?.bottom === undefined ? 5 : margin.bottom,
            left: margin?.left === undefined ? 20 : margin.left,
          }}
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
            label={
              xAxis.label && {
                value: xAxis.label,
                dy: 28,
                className: AXIS_LABEL_CLASSNAME,
              }
            }
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
            label={
              yAxis.label && {
                value: yAxis.label,
                angle: -90,
                position: "bottom",
                offset: -24,
                dx: -16,
                className: AXIS_LABEL_CLASSNAME,
              }
            }
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
              formatter={(value) => itemLabels[value]}
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
                  itemKeys={itemKeys}
                  itemLabels={itemLabels}
                  itemDotColors={itemDotColors}
                />
              )}
            />
          )}
          {renderLines}
        </CoreLineChart>
      </ResponsiveContainer>
    </div>
  );
});
LineChart.displayName = "LineChart";
