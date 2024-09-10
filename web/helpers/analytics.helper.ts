// nivo
import { BarDatum } from "@nivo/bar";
import { IAnalyticsData, IAnalyticsParams, IAnalyticsResponse, TStateGroups } from "@plane/types";
// helpers
import { DATE_KEYS } from "@/constants/analytics";
import { MONTHS_LIST } from "@/constants/calendar";
import { STATE_GROUPS } from "@/constants/state";
import { addSpaceIfCamelCase, capitalizeFirstLetter, generateRandomColor } from "@/helpers/string.helper";
// types
// constants

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
            : (item.dimension ?? "None"),
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

  if (params[type] === "state_id")
    color = analytics?.extras.state_details.find((s) => s.state_id === value)?.state__color;

  if (params[type] === "labels__id")
    color = analytics?.extras.label_details.find((l) => l.labels__id === value)?.labels__color ?? undefined;

  if (params[type] === "state__group") color = STATE_GROUPS[value.toLowerCase() as TStateGroups]?.color ?? undefined;

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

export const generateDisplayName = (
  value: string,
  analytics: IAnalyticsResponse,
  params: IAnalyticsParams,
  type: "x_axis" | "segment"
): string => {
  let displayName = addSpaceIfCamelCase(value);

  if (!analytics) return displayName;

  if (params[type] === "assignees__id")
    displayName =
      analytics?.extras.assignee_details.find((a) => a.assignees__id === value)?.assignees__display_name ??
      "No assignee";

  if (params[type] === "issue_cycle__cycle_id")
    displayName =
      analytics?.extras.cycle_details.find((c) => c.issue_cycle__cycle_id === value)?.issue_cycle__cycle__name ??
      "None";

  if (params[type] === "issue_module__module_id")
    displayName =
      analytics?.extras.module_details.find((m) => m.issue_module__module_id === value)?.issue_module__module__name ??
      "None";

  if (params[type] === "labels__id")
    displayName = analytics?.extras.label_details.find((l) => l.labels__id === value)?.labels__name ?? "None";

  if (params[type] === "state_id")
    displayName = analytics?.extras.state_details.find((s) => s.state_id === value)?.state__name ?? "None";

  if (DATE_KEYS.includes(params.segment ?? "")) displayName = renderMonthAndYear(value);

  return displayName;
};

export const renderMonthAndYear = (date: string | number | null): string => {
  if (!date || date === "") return "";

  const monthNumber = parseInt(`${date}`.split("-")[1], 10);
  const year = `${date}`.split("-")[0];

  return (MONTHS_LIST[monthNumber]?.shortTitle || "None") + ` ${year ? year : ""}`;
};

export const MAX_CHART_LABEL_LENGTH = 15;
export const renderChartDynamicLabel = (
  label: string,
  length: number = MAX_CHART_LABEL_LENGTH
): { label: string; length: number } => {
  const currentLabel = label.substring(0, length);
  return {
    label: `${label.length > MAX_CHART_LABEL_LENGTH ? `${currentLabel.substring(0, MAX_CHART_LABEL_LENGTH - 3)}...` : currentLabel}`,
    length: currentLabel.length,
  };
};
