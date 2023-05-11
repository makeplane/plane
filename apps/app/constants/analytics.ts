// nivo
import { BarDatum, ComputedDatum } from "@nivo/bar";
// types
import {
  IAnalyticsData,
  IAnalyticsParams,
  IAnalyticsResponse,
  TXAxisValues,
  TYAxisValues,
} from "types";
import { STATE_GROUP_COLORS } from "./state";

export const ANALYTICS_X_AXIS_VALUES: { value: TXAxisValues; label: string }[] = [
  {
    value: "state__name",
    label: "State Name",
  },
  {
    value: "state__group",
    label: "State Group",
  },
  {
    value: "priority",
    label: "Priority",
  },
  {
    value: "labels__name",
    label: "Label",
  },
  {
    value: "assignees__email",
    label: "Assignee",
  },
  {
    value: "estimate_point",
    label: "Estimate",
  },
  {
    value: "issue_cycle__cycle__name",
    label: "Cycle",
  },
  {
    value: "issue_module__module__name",
    label: "Module",
  },
  {
    value: "completed_at",
    label: "Completed date",
  },
  {
    value: "target_date",
    label: "Due date",
  },
  {
    value: "start_date",
    label: "Start Date",
  },
  {
    value: "created_at",
    label: "Created date",
  },
];

export const ANALYTICS_Y_AXIS_VALUES: { value: TYAxisValues; label: string }[] = [
  {
    value: "issue_count",
    label: "Issue Count",
  },
  {
    value: "effort",
    label: "Effort",
  },
];

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
