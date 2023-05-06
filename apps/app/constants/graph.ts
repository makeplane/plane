// nivo
import { Theme } from "@nivo/core";
import { BarDatum } from "@nivo/bar";
// types
import { IAnalyticsData, TYAxisValues } from "types";

export const CHARTS_THEME: Theme = {
  background: "rgb(var(--color-bg-base))",
  textColor: "rgb(var(--color-text-base))",
  axis: {
    domain: {
      line: {
        stroke: "rgb(var(--color-text-base))",
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "rgb(var(--color-bg-surface-2))",
      color: "rgb(var(--color-text-secondary))",
      fontSize: "0.8rem",
    },
  },
  grid: {
    line: {
      stroke: "rgb(var(--color-border))",
    },
  },
};

export const DEFAULT_MARGIN = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};

export const convertResponseToBarGraphData = (
  response: IAnalyticsData | undefined,
  segmented: boolean,
  yAxis: TYAxisValues
): { data: BarDatum[]; xAxisKeys: string[] } => {
  if (!response || !(typeof response === "object") || Object.keys(response).length === 0)
    return { data: [], xAxisKeys: [] };

  const data: BarDatum[] = [];

  let xAxisKeys: string[] = [];
  const yAxisKey = yAxis === "issue_count" ? "count" : "effort";

  Object.keys(response).forEach((key) => {
    const segments: { [key: string]: number } = {};

    if (segmented) {
      response[key].map((item: any) => {
        segments[item.segment ?? "None"] = item[yAxisKey] ?? 0;

        // store the segment in the xAxisKeys array
        if (!xAxisKeys.includes(item.segment ?? "None")) xAxisKeys.push(item.segment ?? "None");
      });

      data.push({
        name: key,
        ...segments,
      });
    } else {
      xAxisKeys = [yAxisKey];

      const item = response[key][0];

      data.push({
        name: item.dimension ?? "None",
        [yAxisKey]: item[yAxisKey] ?? 0,
      });
    }
  });

  return { data, xAxisKeys };
};

export const convertResponseToScatterPlotGraphData = (response: IAnalyticsData | undefined) => {};
