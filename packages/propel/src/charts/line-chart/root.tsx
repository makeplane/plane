/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { LineChart as CoreLineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, LABEL_CLASSNAME } from "@plane/constants";
import { TLineChartProps } from "@plane/types";
// local components
import { CustomXAxisTick, CustomYAxisTick } from "../tick";
import { CustomTooltip } from "../tooltip";

export const LineChart = React.memo(<K extends string, T extends string>(props: TLineChartProps<K, T>) => {
  const {
    data,
    lines,
    xAxis,
    yAxis,
    className = "w-full h-96",
    tickCount = {
      x: undefined,
      y: 10,
    },
    showTooltip = true,
  } = props;
  // derived values
  const itemKeys = useMemo(() => lines.map((line) => line.key), [lines]);
  const itemDotClassNames = useMemo(
    () => lines.reduce((acc, line) => ({ ...acc, [line.key]: line.dotClassName }), {}),
    [lines]
  );

  const renderLines = useMemo(
    () =>
      lines.map((line) => (
        <Line key={line.key} dataKey={line.key} type="monotone" className={line.className} stroke="inherit" />
      )),
    [lines]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreLineChart
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
          <XAxis
            dataKey={xAxis.key}
            tick={(props) => <CustomXAxisTick {...props} />}
            tickLine={{
              stroke: "currentColor",
              className: AXIS_LINE_CLASSNAME,
            }}
            axisLine={{
              stroke: "currentColor",
              className: AXIS_LINE_CLASSNAME,
            }}
            label={{
              value: xAxis.label,
              dy: 28,
              className: LABEL_CLASSNAME,
            }}
            tickCount={tickCount.x}
          />
          <YAxis
            domain={yAxis.domain}
            tickLine={{
              stroke: "currentColor",
              className: AXIS_LINE_CLASSNAME,
            }}
            axisLine={{
              stroke: "currentColor",
              className: AXIS_LINE_CLASSNAME,
            }}
            label={{
              value: yAxis.label,
              angle: -90,
              position: "bottom",
              offset: -24,
              dx: -16,
              className: LABEL_CLASSNAME,
            }}
            tick={(props) => <CustomYAxisTick {...props} />}
            tickCount={tickCount.y}
            allowDecimals={!!yAxis.allowDecimals}
          />
          {showTooltip && (
            <Tooltip
              cursor={{ fill: "currentColor", className: "text-custom-background-90/80 cursor-pointer" }}
              content={({ active, label, payload }) => (
                <CustomTooltip
                  active={active}
                  label={label}
                  payload={payload}
                  itemKeys={itemKeys}
                  itemDotClassNames={itemDotClassNames}
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
