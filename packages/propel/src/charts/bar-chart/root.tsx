/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart as CoreBarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
// plane imports
import { AXIS_LABEL_CLASSNAME } from "@plane/constants";
import { TBarChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomXAxisTick, CustomYAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";
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
  // states
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);
  // derived values
  const stackKeys = useMemo(() => bars.map((bar) => bar.key), [bars]);
  const stackLabels: Record<string, string> = useMemo(
    () => bars.reduce((acc, bar) => ({ ...acc, [bar.key]: bar.label }), {}),
    [bars]
  );
  const stackDotColors = useMemo(() => bars.reduce((acc, bar) => ({ ...acc, [bar.key]: bar.fill }), {}), [bars]);

  const renderBars = useMemo(
    () =>
      bars.map((bar) => (
        <Bar
          key={bar.key}
          dataKey={bar.key}
          stackId={bar.stackId}
          opacity={!!activeLegend && activeLegend !== bar.key ? 0.1 : 1}
          fill={bar.fill}
          shape={(shapeProps: any) => {
            const showTopBorderRadius = bar.showTopBorderRadius?.(shapeProps.dataKey, shapeProps.payload);
            const showBottomBorderRadius = bar.showBottomBorderRadius?.(shapeProps.dataKey, shapeProps.payload);

            return (
              <CustomBar
                {...shapeProps}
                stackKeys={stackKeys}
                textClassName={bar.textClassName}
                showPercentage={bar.showPercentage}
                showTopBorderRadius={!!showTopBorderRadius}
                showBottomBorderRadius={!!showBottomBorderRadius}
              />
            );
          }}
          className="[&_path]:transition-opacity [&_path]:duration-200"
          onMouseEnter={() => setActiveBar(bar.key)}
          onMouseLeave={() => setActiveBar(null)}
        />
      )),
    [activeLegend, stackKeys, bars]
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
          <CartesianGrid stroke="rgba(var(--color-border-100), 0.8)" vertical={false} />
          <XAxis
            dataKey={xAxis.key}
            tick={(props) => <CustomXAxisTick {...props} />}
            tickLine={false}
            axisLine={false}
            label={{
              value: xAxis.label,
              dy: 28,
              className: AXIS_LABEL_CLASSNAME,
            }}
            tickCount={tickCount.x}
          />
          <YAxis
            domain={yAxis.domain}
            tickLine={false}
            axisLine={false}
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
            // @ts-expect-error recharts types are not up to date
            <Legend
              onMouseEnter={(payload) => setActiveLegend(payload.value)}
              onMouseLeave={() => setActiveLegend(null)}
              formatter={(value) => stackLabels[value]}
              {...getLegendProps(legend)}
            />
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
              content={({ active, label, payload }) => (
                <CustomTooltip
                  active={active}
                  label={label}
                  payload={payload}
                  activeKey={activeBar}
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
