import { useState } from "react";

// nivo
import { BarDatum } from "@nivo/bar";
// ui
import { BarGraph, Loader } from "components/ui";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";
// constants
import { generateBarColor } from "constants/analytics";
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  barGraphData: {
    data: BarDatum[];
    xAxisKeys: string[];
  };
  params: IAnalyticsParams;
  yAxisKey: "effort" | "count";
};

export const AnalyticsGraph: React.FC<Props> = ({ analytics, barGraphData, params, yAxisKey }) => {
  const generateYAxisTickValues = () => {
    if (!analytics) return [];

    let data: number[] = [];

    if (params.segment)
      // find the total no of issues in each segment
      data = Object.keys(analytics.distribution).map((segment) => {
        let totalSegmentIssues = 0;

        analytics.distribution[segment].map((s) => {
          totalSegmentIssues += s[yAxisKey] as number;
        });

        return totalSegmentIssues;
      });
    else data = barGraphData.data.map((d) => d[yAxisKey] as number);

    const minValue = 0;
    const maxValue = Math.max(...data);

    const valueRange = maxValue - minValue;

    let tickInterval = 1;
    if (valueRange > 10) tickInterval = 2;
    if (valueRange > 50) tickInterval = 5;
    if (valueRange > 100) tickInterval = 10;
    if (valueRange > 200) tickInterval = 50;
    if (valueRange > 300) tickInterval = (Math.ceil(valueRange / 100) * 100) / 10;

    const tickValues = [];
    let tickValue = minValue;
    while (tickValue <= maxValue) {
      tickValues.push(tickValue);
      tickValue += tickInterval;
    }

    return tickValues;
  };

  const CustomTick = (datum: any) => {
    const [isTickHovered, setIsTickHovered] = useState(false);

    const handleTickMouseEnter = () => {
      setIsTickHovered(true);
    };

    const handleTickMouseLeave = () => {
      setIsTickHovered(false);
    };

    return (
      <g
        transform={`translate(${datum.x},${datum.y + 4})`}
        className="custom-tick cursor-pointer"
        onMouseEnter={handleTickMouseEnter}
        onMouseLeave={handleTickMouseLeave}
      >
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={`${
            isTickHovered ? "rgb(var(--color-text-base))" : "rgb(var(--color-text-secondary))"
          }`}
          fontSize={11}
          className={`${params.x_axis === "priority" ? "capitalize" : ""}`}
        >
          {datum.value}
        </text>
      </g>
    );
  };

  if (!analytics)
    return (
      <Loader>
        <Loader.Item height="400px" />
      </Loader>
    );

  return (
    <BarGraph
      data={barGraphData.data}
      indexBy="name"
      keys={barGraphData.xAxisKeys}
      axisLeft={{
        tickSize: 0,
        tickPadding: 10,
        tickValues: generateYAxisTickValues(),
      }}
      axisBottom={{
        renderTick: CustomTick,
      }}
      enableLabel={false}
      colors={(datum) =>
        generateBarColor(
          `${datum[params.segment ? "id" : "indexValue"]}`,
          analytics,
          params,
          params.segment ? "segment" : "x_axis"
        )
      }
      // padding={0.9}
      margin={{ ...DEFAULT_MARGIN, right: 20 }}
      theme={{
        ...CHARTS_THEME,
        background: "rgb(var(--color-bg-surface-1))",
        axis: {},
      }}
      onMouseEnter={(data) => {
        console.log(data);
      }}
    />
  );
};
