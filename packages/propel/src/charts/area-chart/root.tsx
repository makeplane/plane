import React, { useMemo, useState } from "react";
import { Area, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart, CartesianGrid } from "recharts";
// plane imports
import { AXIS_LABEL_CLASSNAME } from "@plane/constants";
import type { TAreaChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomXAxisTick, CustomYAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";

export const AreaChart = React.memo(function AreaChart<K extends string, T extends string>(
  props: TAreaChartProps<K, T>
) {
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
    customTicks,
    showTooltip = true,
    comparisonLine,
  } = props;
  // states
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  // derived values
  const { itemKeys, itemLabels, itemDotColors } = useMemo(() => {
    const keys: string[] = [];
    const labels: Record<string, string> = {};
    const colors: Record<string, string> = {};

    for (const area of areas) {
      keys.push(area.key);
      labels[area.key] = area.label;
      colors[area.key] = area.fill;
    }

    return { itemKeys: keys, itemLabels: labels, itemDotColors: colors };
  }, [areas]);

  const renderAreas = useMemo(
    () =>
      areas.map((area) => (
        <Area
          key={area.key}
          type={area.smoothCurves ? "monotone" : "linear"}
          dataKey={area.key}
          stackId={area.stackId}
          fill={area.fill}
          opacity={!!activeLegend && activeLegend !== area.key ? 0.1 : 1}
          fillOpacity={area.fillOpacity}
          strokeOpacity={area.strokeOpacity}
          stroke={area.strokeColor}
          strokeWidth={2}
          style={area.style}
          dot={
            area.showDot
              ? {
                  fill: area.fill,
                  fillOpacity: 1,
                }
              : false
          }
          activeDot={{
            stroke: area.fill,
          }}
          onMouseEnter={() => setActiveArea(area.key)}
          onMouseLeave={() => setActiveArea(null)}
          className="[&_path]:transition-opacity [&_path]:duration-200"
        />
      )),
    [activeLegend, areas]
  );

  // create comparison line data for straight line from origin to last point
  const comparisonLineData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // get the last data point
    const lastPoint = data[data.length - 1];
    // for the y-value in the last point, use its yAxis key value
    const lastYValue = lastPoint[yAxis.key] ?? 0;
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
  }, [data, xAxis.key, yAxis.key]);
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
        >
          <CartesianGrid stroke="var(--border-color-subtle)" vertical={false} />
          <XAxis
            dataKey={xAxis.key}
            tick={(props) => {
              const TickComponent = customTicks?.x || CustomXAxisTick;
              return <TickComponent {...props} />;
            }}
            tickLine={false}
            axisLine={false}
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
            tickLine={false}
            axisLine={false}
            label={
              yAxis.label && {
                value: yAxis.label,
                angle: -90,
                position: "bottom",
                offset: yAxis.offset ?? -24,
                dx: yAxis.dx ?? -16,
                className: AXIS_LABEL_CLASSNAME,
              }
            }
            tick={(props) => {
              const TickComponent = customTicks?.y || CustomYAxisTick;
              return <TickComponent {...props} />;
            }}
            tickCount={tickCount.y}
            allowDecimals={!!yAxis.allowDecimals}
          />
          {legend && (
            // @ts-expect-error recharts types are not up to date
            <Legend
              formatter={(value) => itemLabels[value]}
              onMouseEnter={(payload) => setActiveLegend(payload.value)}
              onMouseLeave={() => setActiveLegend(null)}
              {...getLegendProps(legend)}
            />
          )}
          {showTooltip && (
            <Tooltip
              cursor={{
                stroke: "var(--text-color-tertiary)",
                strokeDasharray: "4 4",
              }}
              wrapperStyle={{
                pointerEvents: "auto",
              }}
              content={({ active, label, payload }) => (
                <CustomTooltip
                  active={active}
                  activeKey={activeArea}
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
