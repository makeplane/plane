/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
import type { TTimeReportDimension, TTimeReportGroup, TTimeReportInterval } from "@plane/types";
import { addDaysToISODate, formatTimeDuration } from "@plane/utils";
// hooks
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";

/**
 * Categorical series colors, in fixed order (never cycled). Validated for colorblind separation and
 * lightness/contrast on Plane's light (#fff) and dark (~#1c1c1c) surfaces with the dataviz palette checker;
 * Plane's own chart palettes don't pass in any order. A 9th series folds into "Other" (neutral gray).
 * Three light slots sit under 3:1 contrast, so every chart keeps a legend, tooltips and a table view.
 */
const SERIES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};
const OTHER = { light: "#a3a3a0", dark: "#6b6b68" };
/** sequential (magnitude) hue for the pivot heat tint: slot 1 */
const SEQUENTIAL = { light: "#2a78d6", dark: "#3987e5" };

export const MAX_SERIES = SERIES.light.length;
export const OTHER_KEY = "__other__";
/** surface color, for the 2px gaps between stacked segments */
export const SURFACE_COLOR = "var(--background-color-surface-1)";

export const useChartColors = () => {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  return { series: SERIES[mode], other: OTHER[mode], sequential: SEQUENTIAL[mode] };
};

export type TTimeUnits = "clock" | "decimal";

export const formatUnits = (seconds: number, units: TTimeUnits) =>
  units === "decimal" ? `${formatTimeDuration(seconds, "decimal")}h` : formatTimeDuration(seconds, "clock");

export const toHours = (seconds: number) => Math.round((seconds / 3600) * 100) / 100;

/** the top `limit` groups, the rest folded into one "Other" group */
export const foldTopGroups = (groups: TTimeReportGroup[], limit: number, otherLabel: string): TTimeReportGroup[] => {
  if (groups.length <= limit) return groups;
  const rest = groups.slice(limit);
  return [
    ...groups.slice(0, limit),
    {
      key: OTHER_KEY,
      label: otherLabel,
      total_seconds: rest.reduce((sum, group) => sum + group.total_seconds, 0),
      billable_seconds: rest.reduce((sum, group) => sum + group.billable_seconds, 0),
      entry_count: rest.reduce((sum, group) => sum + group.entry_count, 0),
    },
  ];
};

/** the last day of a date bucket */
export const bucketEnd = (start: string, interval: TTimeReportInterval) => {
  if (interval === "day") return start;
  if (interval === "week") return addDaysToISODate(start, 6);
  const [year, month] = start.split("-").map(Number);
  const end = new Date(Date.UTC(year, month, 0));
  return end.toISOString().slice(0, 10);
};

/**
 * The filter that narrows to one group of a dimension (for drill-down). Returns null when the
 * group can't be expressed as a filter (e.g. "No label" or "Other").
 */
export const filterForGroup = (
  dimension: TTimeReportDimension,
  key: string | null,
  interval: TTimeReportInterval | null
): TTimeTrackingFilterPatch | null => {
  if (key === OTHER_KEY) return null;
  if (key === null) {
    // the "No work item" bucket of work-item-based dimensions
    return ["issue", "state", "state_group", "priority"].includes(dimension) ? { has_issue: false } : null;
  }
  switch (dimension) {
    case "user":
      return { user_ids: [key] };
    case "project":
      return { project_ids: [key] };
    case "issue":
      return { issue_ids: [key] };
    case "label":
      return { label_ids: [key] };
    case "state":
      return { state_ids: [key] };
    case "state_group":
      return { state_groups: [key as never] };
    case "cycle":
      return { cycle_ids: [key] };
    case "module":
      return { module_ids: [key] };
    case "priority":
      return { priorities: [key as never] };
    case "assignee":
      return { assignee_ids: [key] };
    case "billable":
      return { is_billable: key === "true" };
    case "source":
      return { source: key as "timer" | "manual" };
    case "date":
      return { date_preset: "custom", date_from: key, date_to: bucketEnd(key, interval ?? "day") };
  }
};
