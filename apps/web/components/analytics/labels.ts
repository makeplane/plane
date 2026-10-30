/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TChart, ChartXAxisProperty } from "@plane/types";

type Translate = (key: string) => string;

export const analyticsLabel = (value: string, t: Translate): string =>
  t(`workspace_analytics.chart.${value.toLowerCase()}`);

/** Translate only system categories; a user's state or label named "High" is still their own text. */
export const localizeAnalyticsChart = (
  chart: TChart,
  xAxis: ChartXAxisProperty,
  groupBy: ChartXAxisProperty | undefined,
  t: Translate
): TChart => {
  const category = (property: ChartXAxisProperty | undefined, key: string, name: string): string => {
    const value = key.toLowerCase();
    if (property === "PRIORITY" && ["urgent", "high", "medium", "low", "none"].includes(value)) return t(value);
    if (property === "STATE_GROUPS" && ["backlog", "unstarted", "started", "completed", "cancelled"].includes(value))
      return t(`workspace_projects.state.${value}`);
    return name;
  };
  const localized = structuredClone(chart);
  for (const datum of localized.data) datum.name = category(xAxis, datum.key, datum.name);
  for (const key of Object.keys(localized.schema))
    localized.schema[key] = category(groupBy, key, localized.schema[key]);
  return localized;
};
