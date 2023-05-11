// nivo
import { BarDatum } from "@nivo/bar";
// types
import { IAnalyticsData, IAnalyticsParams, IAnalyticsResponse, TYAxisValues } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

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

export const generateBarColor = (
  value: string,
  analytics: IAnalyticsResponse,
  params: IAnalyticsParams,
  type: "x_axis" | "segment"
): string => {
  let color: string | undefined = "rgb(var(--color-accent))";

  if (!analytics) return color;

  if (params[type] === "state__name" || params[type] === "labels__name")
    color = analytics?.extras?.colors.find((c) => c.name === value)?.color;

  if (params[type] === "state__group") color = STATE_GROUP_COLORS[value];

  if (params[type] === "priority")
    color =
      value === "urgent"
        ? "#ef4444"
        : value === "high"
        ? "#f97316"
        : value === "medium"
        ? "#eab308"
        : value === "low"
        ? "#22c55e"
        : "#ced4da";

  return color ?? "rgb(var(--color-accent))";
};

export const generateYAxisTickValues = (data: number[]) => {
  const minValue = 0;
  const maxValue = Math.max(...data);

  const valueRange = maxValue - minValue;

  let tickInterval = 1;

  if (valueRange < 10) tickInterval = 1;
  else if (valueRange < 20) tickInterval = 2;
  else if (valueRange < 50) tickInterval = 5;
  else tickInterval = (Math.ceil(valueRange / 100) * 100) / 10;

  const tickValues = [];
  let tickValue = minValue;
  while (tickValue <= maxValue) {
    tickValues.push(tickValue);
    tickValue += tickInterval;
  }

  return tickValues;
};
