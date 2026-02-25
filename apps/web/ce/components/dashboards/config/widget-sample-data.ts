/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Static sample data for widget preview rendering.
 * No API calls — used only in the config modal preview panel.
 */

import type { IAnalyticsChartData, IAnalyticsNumberWidgetData } from "@plane/types";

// Sample chart data keyed by chart_property
const SAMPLE_CHART_DATA: Record<string, IAnalyticsChartData> = {
  priority: {
    data: [
      { name: "Urgent", count: 5 },
      { name: "High", count: 12 },
      { name: "Medium", count: 18 },
      { name: "Low", count: 8 },
      { name: "None", count: 3 },
    ],
    schema: { name: "string", count: "number" },
  },
  state_group: {
    data: [
      { name: "Backlog", count: 8 },
      { name: "Unstarted", count: 15 },
      { name: "Started", count: 22 },
      { name: "Completed", count: 30 },
      { name: "Cancelled", count: 4 },
    ],
    schema: { name: "string", count: "number" },
  },
  state: {
    data: [
      { name: "Todo", count: 10 },
      { name: "In Progress", count: 14 },
      { name: "In Review", count: 6 },
      { name: "Done", count: 20 },
    ],
    schema: { name: "string", count: "number" },
  },
  assignee: {
    data: [
      { name: "Alice", count: 12 },
      { name: "Bob", count: 9 },
      { name: "Charlie", count: 15 },
      { name: "Diana", count: 7 },
    ],
    schema: { name: "string", count: "number" },
  },
  labels: {
    data: [
      { name: "Bug", count: 14 },
      { name: "Feature", count: 22 },
      { name: "Improvement", count: 8 },
      { name: "Documentation", count: 5 },
    ],
    schema: { name: "string", count: "number" },
  },
  cycle: {
    data: [
      { name: "Sprint 1", count: 18 },
      { name: "Sprint 2", count: 24 },
      { name: "Sprint 3", count: 12 },
    ],
    schema: { name: "string", count: "number" },
  },
  module: {
    data: [
      { name: "Auth", count: 10 },
      { name: "Dashboard", count: 16 },
      { name: "API", count: 20 },
    ],
    schema: { name: "string", count: "number" },
  },
  estimate_point: {
    data: [
      { name: "1", count: 8 },
      { name: "2", count: 14 },
      { name: "3", count: 10 },
      { name: "5", count: 6 },
      { name: "8", count: 3 },
    ],
    schema: { name: "string", count: "number" },
  },
  start_date: {
    data: [
      { name: "Jan", count: 12 },
      { name: "Feb", count: 18 },
      { name: "Mar", count: 24 },
      { name: "Apr", count: 16 },
    ],
    schema: { name: "string", count: "number" },
  },
  target_date: {
    data: [
      { name: "Jan", count: 10 },
      { name: "Feb", count: 20 },
      { name: "Mar", count: 15 },
      { name: "Apr", count: 22 },
    ],
    schema: { name: "string", count: "number" },
  },
  created_at: {
    data: [
      { name: "Week 1", count: 8 },
      { name: "Week 2", count: 14 },
      { name: "Week 3", count: 18 },
      { name: "Week 4", count: 12 },
    ],
    schema: { name: "string", count: "number" },
  },
  completed_at: {
    data: [
      { name: "Week 1", count: 5 },
      { name: "Week 2", count: 10 },
      { name: "Week 3", count: 16 },
      { name: "Week 4", count: 22 },
    ],
    schema: { name: "string", count: "number" },
  },
};

export function getSampleChartData(property: string): IAnalyticsChartData {
  return SAMPLE_CHART_DATA[property] ?? SAMPLE_CHART_DATA.priority;
}

export function getSampleNumberData(metric: string): IAnalyticsNumberWidgetData {
  return {
    value: metric === "estimate_points" ? 385 : 142,
    metric,
  };
}
