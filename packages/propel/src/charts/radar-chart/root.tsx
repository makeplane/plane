import { useMemo, useState } from 'react'
import { PolarGrid, Radar, RadarChart as CoreRadarChart, ResponsiveContainer, PolarAngleAxis, Tooltip, Legend } from 'recharts';
import { TRadarChartProps } from '@plane/types';
import { getLegendProps } from '../components/legend';
import { CustomRadarAxisTick } from '../components/tick';
import { CustomTooltip } from '../components/tooltip';

const RadarChart = <T extends string, K extends string>(props: TRadarChartProps<T, K>) => {
  const { data, radars, margin, showTooltip, legend, className, angleAxis } = props;

  // states
  const [, setActiveIndex] = useState<number | null>(null);
  const [activeLegend, setActiveLegend] = useState<string | null>(null);

  const itemKeys = useMemo(() => radars.map((radar) => radar.key), [radars]);
  const itemLabels = useMemo(() => radars.reduce((acc, radar) => ({ ...acc, [radar.key]: radar.name }), {}), [radars]);
  const itemDotColors = useMemo(() => radars.reduce((acc, radar) => ({ ...acc, [radar.key]: radar.stroke }), {}), [radars]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <CoreRadarChart cx="50%" cy="50%" outerRadius="80%" data={data} margin={margin}>
          <PolarGrid stroke='rgba(var(--color-border-100), 0.9)' />
          <PolarAngleAxis dataKey={angleAxis.key}
            tick={(props) => <CustomRadarAxisTick {...props} />}
          />
          {showTooltip && (
            <Tooltip
              cursor={{
                stroke: "rgba(var(--color-text-300))",
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
  )
}

export { RadarChart };