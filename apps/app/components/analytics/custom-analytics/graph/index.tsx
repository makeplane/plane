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
  yAxisKey: "count" | "estimate";
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
      tooltip={(datum) => <CustomTooltip datum={datum} analytics={analytics} params={params} />}
      height={fullScreen ? "400px" : "300px"}
      margin={{
        right: 20,
        bottom: params.x_axis === "assignees__id" ? 50 : longestXAxisLabel.length * 5 + 20,
      }}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        tickRotation: barGraphData.data.length > 7 ? -45 : 0,
        renderTick:
          params.x_axis === "assignees__id"
            ? (datum) => {
                const avatar = analytics.extras.assignee_details?.find(
                  (a) => a?.assignees__display_name === datum?.value
                )?.assignees__avatar;

                if (avatar && avatar !== "")
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <image
                        x={-8}
                        y={10}
                        width={16}
                        height={16}
                        xlinkHref={avatar}
                        style={{ clipPath: "circle(50%)" }}
                      />
                    </g>
                  );
                else
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <circle cy={18} r={8} fill="#374151" />
                      <text x={0} y={21} textAnchor="middle" fontSize={9} fill="#ffffff">
                        {datum.value && datum.value !== "None"
                          ? `${datum.value}`.toUpperCase()[0]
                          : "?"}
                      </text>
                    </g>
                  );
              }
            : undefined,
      }}
      theme={{
        axis: {},
      }}
    />
  );
};
