import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  LineChart as CoreLineChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
// plane imports
import { AXIS_LABEL_CLASSNAME } from "@plane/constants";
import type { TLineChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomXAxisTick, CustomYAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";

export const LineChart = React.memo(function LineChart<K extends string, T extends string>(
  props: TLineChartProps<K, T>
) {
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
    customTicks,
    legend,
    showTooltip = true,
    customTooltipContent,
  } = props;
  // states
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  // derived values
  const { itemKeys, itemLabels, itemDotColors } = useMemo(() => {
    const keys: string[] = [];
    const labels: Record<string, string> = {};
    const colors: Record<string, string> = {};

    for (const line of lines) {
      keys.push(line.key);
      labels[line.key] = line.label;
      colors[line.key] = line.stroke;
    }

    return { itemKeys: keys, itemLabels: labels, itemDotColors: colors };
  }, [lines]);

  const renderLines = useMemo(
    () =>
      lines.map((line) => (
        <Line
          key={line.key}
          dataKey={line.key}
          type={line.smoothCurves ? "monotone" : "linear"}
          className="[&_path]:transition-opacity [&_path]:duration-200"
          opacity={!!activeLegend && activeLegend !== line.key ? 0.1 : 1}
          fill={line.fill}
          stroke={line.stroke}
          strokeWidth={2}
          strokeDasharray={line.dashedLine ? "4 4" : "none"}
          dot={
            line.showDot
              ? {
                  fill: line.fill,
                  fillOpacity: 1,
                }
              : false
          }
          activeDot={{
            stroke: line.fill,
          }}
          onMouseEnter={() => setActiveLine(line.key)}
          onMouseLeave={() => setActiveLine(null)}
        />
      )),
    [activeLegend, lines]
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
              content={({ active, label, payload }) => {
                if (customTooltipContent) return customTooltipContent({ active, label, payload });
                return (
                  <CustomTooltip
                    active={active}
                    activeKey={activeLine}
                    label={label}
                    payload={payload}
                    itemKeys={itemKeys}
                    itemLabels={itemLabels}
                    itemDotColors={itemDotColors}
                  />
                );
              }}
            />
          )}
          {renderLines}
        </CoreLineChart>
      </ResponsiveContainer>
    </div>
  );
});
LineChart.displayName = "LineChart";
