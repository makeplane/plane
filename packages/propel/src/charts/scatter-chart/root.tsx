import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  ScatterChart as CoreScatterChart,
  Legend,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
// plane imports
import { AXIS_LABEL_CLASSNAME } from "@plane/constants";
import type { TScatterChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomXAxisTick, CustomYAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";

export const ScatterChart = React.memo(function ScatterChart<K extends string, T extends string>(
  props: TScatterChartProps<K, T>
) {
  const {
    data,
    scatterPoints,
    margin,
    xAxis,
    yAxis,
    className,
    customTicks,
    tickCount = {
      x: undefined,
      y: 10,
    },
    legend,
    showTooltip = true,
    customTooltipContent,
  } = props;
  // states
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  //derived values
  const { itemKeys, itemLabels, itemDotColors } = useMemo(() => {
    const keys: string[] = [];
    const labels: Record<string, string> = {};
    const colors: Record<string, string> = {};

    for (const point of scatterPoints) {
      keys.push(point.key);
      labels[point.key] = point.label;
      colors[point.key] = point.fill;
    }
    return { itemKeys: keys, itemLabels: labels, itemDotColors: colors };
  }, [scatterPoints]);

  const renderPoints = useMemo(
    () =>
      scatterPoints.map((point) => (
        <Scatter
          key={point.key}
          dataKey={point.key}
          fill={point.fill}
          stroke={point.stroke}
          opacity={!!activeLegend && activeLegend !== point.key ? 0.1 : 1}
          onMouseEnter={() => setActivePoint(point.key)}
          onMouseLeave={() => setActivePoint(null)}
        />
      )),
    [activeLegend, scatterPoints]
  );

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreScatterChart
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
                offset: -24,
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
              onMouseEnter={(payload) => setActiveLegend(payload.value)}
              onMouseLeave={() => setActiveLegend(null)}
              formatter={(value) => itemLabels[value]}
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
              content={({ active, label, payload }) =>
                customTooltipContent ? (
                  customTooltipContent({ active, label, payload })
                ) : (
                  <CustomTooltip
                    active={active}
                    activeKey={activePoint}
                    label={label}
                    payload={payload}
                    itemKeys={itemKeys}
                    itemLabels={itemLabels}
                    itemDotColors={itemDotColors}
                  />
                )
              }
            />
          )}
          {renderPoints}
        </CoreScatterChart>
      </ResponsiveContainer>
    </div>
  );
});
ScatterChart.displayName = "ScatterChart";
