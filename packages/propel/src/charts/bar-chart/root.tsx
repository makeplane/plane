/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo, useState } from "react";
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
import type { TBarChartProps } from "@plane/types";
// local components
import { getLegendProps } from "../components/legend";
import { CustomXAxisTick, CustomYAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";
import { barShapeVariants, DEFAULT_BAR_FILL_COLOR } from "./bar";

export const BarChart = React.memo(function BarChart<K extends string, T extends string>(props: TBarChartProps<K, T>) {
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
    customTicks,
    showTooltip = true,
    customTooltipContent,
  } = props;
  // states
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  // derived values
  const { stackKeys, stackLabels } = useMemo(() => {
    const keys: string[] = [];
    const labels: Record<string, string> = {};

    for (const bar of bars) {
      keys.push(bar.key);
      labels[bar.key] = bar.label;
    }

    return { stackKeys: keys, stackLabels: labels };
  }, [bars]);

  // get bar color dynamically based on payload
  const getBarColor = useCallback(
    (payload: Record<string, string>[], barKey: string) => {
      const bar = bars.find((b) => b.key === barKey);
      if (!bar) return DEFAULT_BAR_FILL_COLOR;

      if (typeof bar.fill === "function") {
        const payloadItem = payload?.find((item) => item.dataKey === barKey);
        if (payloadItem?.payload) {
          try {
            return bar.fill(payloadItem.payload);
          } catch (error) {
            console.error(error);
            return DEFAULT_BAR_FILL_COLOR;
          }
        } else {
          return DEFAULT_BAR_FILL_COLOR; // fallback color when no payload data
        }
      } else {
        return bar.fill;
      }
    },
    [bars]
  );

  // get all bar colors
  const getAllBarColors = useCallback(
    (payload: any[]) => {
      const colors: Record<string, string> = {};
      for (const bar of bars) {
        colors[bar.key] = getBarColor(payload, bar.key);
      }
      return colors;
    },
    [bars, getBarColor]
  );

  const renderBars = useMemo(
    () =>
      bars.map((bar) => (
        <Bar
          key={bar.key}
          dataKey={bar.key}
          stackId={bar.stackId}
          opacity={!!activeLegend && activeLegend !== bar.key ? 0.1 : 1}
          shape={(shapeProps: any) => {
            const shapeVariant = barShapeVariants[bar.shapeVariant ?? "bar"];
            const node = shapeVariant(shapeProps, bar, stackKeys);
            return React.isValidElement(node) ? node : <>{node}</>;
          }}
          className="[&_path]:transition-opacity [&_path]:duration-200"
          onMouseEnter={() => setActiveBar(bar.key)}
          onMouseLeave={() => setActiveBar(null)}
          fill={getBarColor(data, bar.key)}
        />
      )),
    [activeLegend, stackKeys, bars, getBarColor, data]
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
          <CartesianGrid stroke="var(--border-color-subtle)" vertical={false} />
          <XAxis
            dataKey={xAxis.key}
            tick={(props) => {
              const TickComponent = customTicks?.x || CustomXAxisTick;
              return <TickComponent {...props} />;
            }}
            tickLine={false}
            axisLine={false}
            label={{
              value: xAxis.label,
              dy: xAxis.dy ?? 28,
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
              offset: yAxis.offset ?? -24,
              dx: yAxis.dx ?? -16,
              className: AXIS_LABEL_CLASSNAME,
            }}
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
              formatter={(value) => stackLabels[value]}
              {...getLegendProps(legend)}
            />
          )}
          {showTooltip && (
            <Tooltip
              cursor={{
                fill: "var(--alpha-black-300)",
                className: "bg-layer-1 cursor-pointer",
              }}
              wrapperStyle={{
                pointerEvents: "auto",
              }}
              content={({ active, label, payload }) => {
                if (customTooltipContent) return customTooltipContent({ active, label, payload });
                return (
                  <CustomTooltip
                    active={active}
                    label={label}
                    payload={payload}
                    activeKey={activeBar}
                    itemKeys={stackKeys}
                    itemLabels={stackLabels}
                    itemDotColors={getAllBarColors(payload || [])}
                  />
                );
              }}
            />
          )}
          {renderBars}
        </CoreBarChart>
      </ResponsiveContainer>
    </div>
  );
});
BarChart.displayName = "BarChart";
