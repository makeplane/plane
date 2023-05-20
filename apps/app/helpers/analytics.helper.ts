// nivo
import { BarDatum } from "@nivo/bar";
// helpers
import { capitalizeFirstLetter, generateRandomColor } from "helpers/string.helper";
// types
import { IAnalyticsData, IAnalyticsParams, IAnalyticsResponse } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";
import { MONTHS_LIST } from "constants/calendar";
import { DATE_KEYS } from "constants/analytics";

export const convertResponseToBarGraphData = (
  response: IAnalyticsData | undefined,
  params: IAnalyticsParams
): { data: BarDatum[]; xAxisKeys: string[] } => {
  if (!response || !(typeof response === "object") || Object.keys(response).length === 0)
    return { data: [], xAxisKeys: [] };

  const data: BarDatum[] = [];

  let xAxisKeys: string[] = [];
  const yAxisKey = params.y_axis === "issue_count" ? "count" : "estimate";

  Object.keys(response).forEach((key) => {
    const segments: { [key: string]: number } = {};

    if (params.segment) {
      response[key].map((item: any) => {
        segments[item.segment ?? "None"] = item[yAxisKey] ?? 0;

        // store the segment in the xAxisKeys array
        if (!xAxisKeys.includes(item.segment ?? "None")) xAxisKeys.push(item.segment ?? "None");
      });

      data.push({
        name: DATE_KEYS.includes(params.x_axis)
          ? renderMonthAndYear(key)
          : params.x_axis === "priority" || params.x_axis === "state__group"
          ? capitalizeFirstLetter(key)
          : key,
        ...segments,
      });
    } else {
      xAxisKeys = [yAxisKey];

      const item = response[key][0];

      data.push({
        name: DATE_KEYS.includes(params.x_axis)
          ? renderMonthAndYear(item.dimension)
          : params.x_axis === "priority" || params.x_axis === "state__group"
          ? capitalizeFirstLetter(item.dimension ?? "None")
          : item.dimension ?? "None",
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
  let color: string | undefined = generateRandomColor(value);

  if (!analytics) return color;

  if (params[type] === "state__name" || params[type] === "labels__name")
    color = analytics?.extras?.colors.find((c) => c.name === value)?.color;

  if (params[type] === "state__group") color = STATE_GROUP_COLORS[value.toLowerCase()];

  if (params[type] === "priority") {
    const priority = value.toLowerCase();

    color =
      priority === "urgent"
        ? "#ef4444"
        : priority === "high"
        ? "#f97316"
        : priority === "medium"
        ? "#eab308"
        : priority === "low"
        ? "#22c55e"
        : "#ced4da";
  }

  return color ?? generateRandomColor(value);
};

export const renderMonthAndYear = (date: string | number | null): string => {
  if (!date || date === "") return "";

  return (
    (MONTHS_LIST.find((m) => `${m.value}` === `${date}`.split("-")[1])?.label.substring(0, 3) ??
      "None") + ` ${date}`.split("-")[0] ?? ""
  );
};
