/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { Area, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, ComposedChart } from "recharts";
// plane imports
import { AXIS_LINE_CLASSNAME, AXIS_LABEL_CLASSNAME, TICK_LINE_CLASSNAME } from "@plane/constants";
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
    className,
    legend,
    margin,
    tickCount = {
      x: undefined,
      y: 10,
    },
    showTooltip = true,
    comparisonLine,
  } = props;
  // derived values
  const itemKeys = useMemo(() => areas.map((area) => area.key), [areas]);
  const itemLabels: Record<string, string> = useMemo(
    () => areas.reduce((acc, area) => ({ ...acc, [area.key]: area.label }), {}),
    [areas]
  );
  const itemDotColors = useMemo(() => areas.reduce((acc, area) => ({ ...acc, [area.key]: area.fill }), {}), [areas]);
  const yAxisStrokeColor = yAxis.strokeColor ?? "rgba(var(--color-border-400))";
  const xAxisStrokeColor = xAxis.strokeColor ?? "rgba(var(--color-border-400))";

  const renderAreas = useMemo(
    () =>
      areas.map((area) => (
        <Area
          key={area.key}
          type={area.smoothCurves ? "monotone" : "linear"}
          dataKey={area.key}
          stackId={area.stackId}
          fill={area.fill}
          fillOpacity={area.fillOpacity}
          strokeOpacity={area.strokeOpacity}
          stroke={area.strokeColor}
          style={area.style}
          dot={area.showDot}
        />
      )),
    [areas]
  );

  // create comparison line data for straight line from origin to last point
  const comparisonLineData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // get the last data point
    const lastPoint = data[data.length - 1];
    // for the y-value in the last point, use its yAxis key value
    const lastYValue = lastPoint[yAxis.key] || 0;
    // create data for a straight line that has points at each x-axis position
    return data.map((item, index) => {
      // calculate the y value for this point on the straight line
      // using linear interpolation between (0,0) and (last_x, last_y)
      const ratio = index / (data.length - 1);
      const interpolatedValue = ratio * lastYValue;

      return {
        [xAxis.key]: item[xAxis.key],
        comparisonLine: interpolatedValue,
      };
    });
  }, [data, xAxis.key]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: margin?.top === undefined ? 5 : margin.top,
            right: margin?.right === undefined ? 30 : margin.right,
            bottom: margin?.bottom === undefined ? 5 : margin.bottom,
            left: margin?.left === undefined ? 20 : margin.left,
          }}
          reverseStackOrder
          accessibilityLayer
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
          {renderAreas}
          {comparisonLine && (
            <Line
              data={comparisonLineData}
              type="linear"
              dataKey="comparisonLine"
              stroke={comparisonLine.strokeColor}
              fill={comparisonLine.strokeColor}
              strokeWidth={2}
              strokeDasharray={comparisonLine.dashedLine ? "4 4" : "none"}
              activeDot={false}
              legendType="none"
              name="Comparison line"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
AreaChart.displayName = "AreaChart";
