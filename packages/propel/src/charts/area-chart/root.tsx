/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { AreaChart as CoreAreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, LABEL_CLASSNAME } from "@plane/constants";
import { TAreaChartProps } from "@plane/types";
// local components
import { CustomXAxisTick, CustomYAxisTick } from "../tick";
import { CustomTooltip } from "../tooltip";

export const AreaChart = React.memo(<K extends string, T extends string>(props: TAreaChartProps<K, T>) => {
  const {
    data,
    areas,
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
  const itemKeys = useMemo(() => areas.map((area) => area.key), [areas]);
  const itemDotClassNames = useMemo(
    () => areas.reduce((acc, area) => ({ ...acc, [area.key]: area.dotClassName }), {}),
    [areas]
  );

  const renderAreas = useMemo(
    () =>
      areas.map((area) => (
        <Area
          key={area.key}
          type="monotone"
          dataKey={area.key}
          stackId={area.stackId}
          className={area.className}
          stroke="inherit"
          fill="inherit"
        />
      )),
    [areas]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreAreaChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          reverseStackOrder
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
          {renderAreas}
        </CoreAreaChart>
      </ResponsiveContainer>
    </div>
  );
});
AreaChart.displayName = "AreaChart";
