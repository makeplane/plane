// nivo
import { BarDatum } from "@nivo/bar";
// components
import { CustomTooltip } from "./custom-tooltip";
// ui
import { BarGraph } from "components/ui";
// helpers
import { findStringWithMostCharacters } from "helpers/array.helper";
import { generateBarColor } from "helpers/analytics.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";
// constants

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

    return data;
  };

  const longestXAxisLabel = findStringWithMostCharacters(barGraphData.data.map((d) => `${d.name}`));

  return (
    <BarGraph
      data={barGraphData.data}
      indexBy="name"
      keys={barGraphData.xAxisKeys}
      colors={(datum) =>
        generateBarColor(
          params.segment ? `${datum.id}` : `${datum.indexValue}`,
          analytics,
          params,
          params.segment ? "segment" : "x_axis"
        )
      }
      customYAxisTickValues={generateYAxisTickValues()}
      tooltip={(datum) => <CustomTooltip datum={datum} params={params} />}
      height={fullScreen ? "400px" : "300px"}
      margin={{ right: 20, bottom: longestXAxisLabel.length * 5 + 20 }}
      theme={{
        axis: {},
      }}
    />
  );
};
