// nivo
import { BarDatum } from "@nivo/bar";
// components
import { CustomTooltip } from "./custom-tooltip";
// ui
import { BarGraph } from "components/ui";
// helpers
import { findStringWithMostCharacters } from "helpers/array.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";
// constants
import { generateBarColor } from "constants/analytics";

type Props = {
  analytics: IAnalyticsResponse;
  barGraphData: {
    data: BarDatum[];
    xAxisKeys: string[];
  };
  params: IAnalyticsParams;
  yAxisKey: "effort" | "count";
  fullScreen: boolean;
};

export const AnalyticsGraph: React.FC<Props> = ({
  analytics,
  barGraphData,
  params,
  yAxisKey,
  fullScreen,
}) => {
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

    if (!tickValues.includes(maxValue)) tickValues.push(maxValue);

    return tickValues;
  };

  const longestXAxisLabel = findStringWithMostCharacters(barGraphData.data.map((d) => `${d.name}`));

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
      colors={(datum) =>
        generateBarColor(
          params.segment ? `${datum.id}` : `${datum.indexValue}`,
          analytics,
          params,
          params.segment ? "segment" : "x_axis"
        )
      }
      tooltip={(datum) => <CustomTooltip datum={datum} params={params} />}
      height={fullScreen ? "400px" : "300px"}
      margin={{ right: 20, bottom: longestXAxisLabel.length * 5 + 20 }}
      theme={{
        axis: {},
      }}
    />
  );
};
