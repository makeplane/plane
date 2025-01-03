/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TStackedBarChartProps } from "@plane/types";
import { cn } from "@plane/utils";
// local components
import { CustomStackBar } from "./bar";
import { CustomXAxisTick, CustomYAxisTick } from "./tick";
import { CustomTooltip } from "./tooltip";

// Common classnames
const LABEL_CLASSNAME = "uppercase text-custom-text-300/60 text-sm tracking-wide";
const AXIS_LINE_CLASSNAME = "text-custom-text-400/70";

export const StackedBarChart = React.memo(
  <K extends string, T extends string>({
    data,
    stacks,
    xAxis,
    yAxis,
    barSize = 40,
    className = "w-full h-96",
    tickCount = {
      x: undefined,
      y: 10,
    },
    showTooltip = true,
  }: TStackedBarChartProps<K, T>) => {
    // derived values
    const stackKeys = React.useMemo(() => stacks.map((stack) => stack.key), [stacks]);
    const stackDotClassNames = React.useMemo(
      () => stacks.reduce((acc, stack) => ({ ...acc, [stack.key]: stack.dotClassName }), {}),
      [stacks]
    );

    const renderBars = React.useMemo(
      () =>
        stacks.map((stack) => (
          <Bar
            key={stack.key}
            dataKey={stack.key}
            stackId="a"
            fill={stack.fillClassName}
            shape={(props: any) => (
              <CustomStackBar
                {...props}
                stackKeys={stackKeys}
                textClassName={stack.textClassName}
                showPercentage={stack.showPercentage}
              />
            )}
          />
        )),
      [stackKeys, stacks]
    );

    return (
      <div className={cn(className)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              allowDecimals={yAxis.allowDecimals ?? false}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ fill: "currentColor", className: "text-custom-background-90/80 cursor-pointer" }}
                content={({ active, label, payload }) => (
                  <CustomTooltip
                    active={active}
                    label={label}
                    payload={payload}
                    stackKeys={stackKeys}
                    stackDotClassNames={stackDotClassNames}
                  />
                )}
              />
            )}
            {renderBars}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
);
StackedBarChart.displayName = "StackedBarChart";
