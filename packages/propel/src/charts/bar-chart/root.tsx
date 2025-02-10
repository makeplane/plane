/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { BarChart as CoreBarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, LABEL_CLASSNAME } from "@plane/constants";
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
    className = "w-full h-96",
    tickCount = {
      x: undefined,
      y: 10,
    },
    showTooltip = true,
  } = props;
  // derived values
  const stackKeys = useMemo(() => bars.map((bar) => bar.key), [bars]);
  const stackDotClassNames = useMemo(
    () => bars.reduce((acc, bar) => ({ ...acc, [bar.key]: bar.dotClassName }), {}),
    [bars]
  );

  const renderBars = useMemo(
    () =>
      bars.map((bar) => (
        <Bar
          key={bar.key}
          dataKey={bar.key}
          stackId={bar.stackId}
          fill={bar.fillClassName}
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
          margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
          barSize={barSize}
          className="recharts-wrapper"
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
                  itemKeys={stackKeys}
                  itemDotClassNames={stackDotClassNames}
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
