"use client";

// nivo
import { BarDatum } from "@nivo/bar";
// components
import { IAnalyticsParams, IAnalyticsResponse } from "@plane/types";
import { Tooltip } from "@plane/ui";
// ui
import { BarGraph } from "@/components/ui";
// helpers
import { generateBarColor, generateDisplayName, renderChartDynamicLabel } from "@/helpers/analytics.helper";
import { findStringWithMostCharacters } from "@/helpers/array.helper";
import { getFileURL } from "@/helpers/file.helper";
// types
import { CustomTooltip } from "./custom-tooltip";

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

export const AnalyticsGraph: React.FC<Props> = ({ analytics, barGraphData, params, yAxisKey, fullScreen }) => {
  const generateYAxisTickValues = () => {
    if (!analytics) return [];

    let data: number[] = [];

    if (params.segment)
      // find the total no of work items in each segment
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
        bottom: params.x_axis === "assignees__id" ? 50 : renderChartDynamicLabel(longestXAxisLabel)?.length * 5 + 20,
      }}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        tickRotation: barGraphData.data.length > 7 ? -45 : 0,
        renderTick:
          params.x_axis === "assignees__id"
            ? (datum) => {
                const assignee = analytics.extras.assignee_details?.find((a) => a?.assignees__id === datum?.value);

                if (assignee?.assignees__avatar_url && assignee?.assignees__avatar_url !== "")
                  return (
                    <Tooltip tooltipContent={assignee?.assignees__display_name}>
                      <g transform={`translate(${datum.x},${datum.y})`}>
                        <image
                          x={-8}
                          y={10}
                          width={16}
                          height={16}
                          xlinkHref={getFileURL(assignee?.assignees__avatar_url)}
                          style={{ clipPath: "circle(50%)" }}
                        />
                      </g>
                    </Tooltip>
                  );
                else
                  return (
                    <Tooltip tooltipContent={assignee?.assignees__display_name}>
                      <g transform={`translate(${datum.x},${datum.y})`}>
                        <circle cy={18} r={8} fill="#374151" />
                        <text x={0} y={21} textAnchor="middle" fontSize={9} fill="#ffffff">
                          {params.x_axis === "assignees__id"
                            ? datum.value && datum.value !== "None"
                              ? generateDisplayName(datum.value, analytics, params, "x_axis")[0].toUpperCase()
                              : "?"
                            : datum.value && datum.value !== "None"
                              ? `${datum.value}`.toUpperCase()[0]
                              : "?"}
                        </text>
                      </g>
                    </Tooltip>
                  );
              }
            : (datum) => (
                <Tooltip tooltipContent={generateDisplayName(datum.value, analytics, params, "x_axis")}>
                  <g transform={`translate(${datum.x},${datum.y + 20})`}>
                    <text
                      x={0}
                      y={datum.y}
                      textAnchor={`${barGraphData.data.length > 7 ? "end" : "middle"}`}
                      fontSize={10}
                      fill="rgb(var(--color-text-200))"
                      className={`${barGraphData.data.length > 7 ? "-rotate-45" : ""}`}
                    >
                      {renderChartDynamicLabel(generateDisplayName(datum.value, analytics, params, "x_axis"))?.label}
                    </text>
                  </g>
                </Tooltip>
              ),
      }}
      theme={{
        axis: {},
      }}
    />
  );
};
