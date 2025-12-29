import { useMemo, useState } from "react";
import {
  PolarGrid,
  Radar,
  RadarChart as CoreRadarChart,
  ResponsiveContainer,
  PolarAngleAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { TRadarChartProps } from "@plane/types";
import { getLegendProps } from "../components/legend";
import { CustomRadarAxisTick } from "../components/tick";
import { CustomTooltip } from "../components/tooltip";

function RadarChart<T extends string, K extends string>(props: TRadarChartProps<T, K>) {
  const { data, radars, margin, showTooltip, legend, className, angleAxis } = props;

  // states
  const [, setActiveIndex] = useState<number | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  const { itemKeys, itemLabels, itemDotColors } = useMemo(() => {
    const keys: string[] = [];
    const labels: Record<string, string> = {};
    const colors: Record<string, string> = {};

    for (const radar of radars) {
      keys.push(radar.key);
      labels[radar.key] = radar.name;
      colors[radar.key] = radar.stroke ?? radar.fill ?? "#000000";
    }
    return { itemKeys: keys, itemLabels: labels, itemDotColors: colors };
  }, [radars]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreRadarChart cx="50%" cy="50%" outerRadius="80%" data={data} margin={margin}>
          <PolarGrid stroke="var(--border-color-subtle)" />
          <PolarAngleAxis dataKey={angleAxis.key} tick={(props) => <CustomRadarAxisTick {...props} />} />
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
                  activeKey={activeLegend}
                  label={label}
                  payload={payload}
                  itemKeys={itemKeys}
                  itemLabels={itemLabels}
                  itemDotColors={itemDotColors}
                />
              )}
            />
          )}
          {legend && (
            // @ts-expect-error recharts types are not up to date
            <Legend
              onMouseEnter={(payload) => {
                // @ts-expect-error recharts types are not up to date
                const key: string | undefined = payload.payload?.key;
                if (!key) return;
                setActiveLegend(key);
                setActiveIndex(null);
              }}
              onMouseLeave={() => setActiveLegend(null)}
              {...getLegendProps(legend)}
            />
          )}
          {radars.map((radar) => (
            <Radar
              key={radar.key}
              name={radar.name}
              dataKey={radar.key}
              stroke={radar.stroke}
              fill={radar.fill}
              fillOpacity={radar.fillOpacity}
              dot={radar.dot}
            />
          ))}
        </CoreRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { RadarChart };
