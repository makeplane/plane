/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IAnalyticsColorPreset, IAnalyticsWidgetConfig } from "@plane/types";

// Widget type options for the create/edit widget UI
export const ANALYTICS_WIDGET_TYPE_OPTIONS = [
  {
    key: "bar" as const,
    label: "Bar Chart",
    description: "Vertical bar chart for comparing values",
    icon: "BarChart3",
  },
  { key: "line" as const, label: "Line Chart", description: "Line chart for trends over time", icon: "LineChart" },
  {
    key: "area" as const,
    label: "Area Chart",
    description: "Filled area chart for cumulative data",
    icon: "AreaChart",
  },
  { key: "donut" as const, label: "Donut Chart", description: "Circular chart with center hole", icon: "PieChart" },
  {
    key: "pie" as const,
    label: "Pie Chart",
    description: "Circular chart showing proportions",
    icon: "PieChart",
  },
  { key: "number" as const, label: "Number Widget", description: "Display single metric value", icon: "Hash" },
];

// Color presets for widget styling
export const ANALYTICS_COLOR_PRESETS: Record<string, IAnalyticsColorPreset> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Vibrant and energetic colors",
    colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f97316", "#14b8a6"],
  },
  horizon: {
    id: "horizon",
    name: "Horizon",
    description: "Warm sunset-inspired palette",
    colors: ["#f97316", "#fb923c", "#fbbf24", "#fde047", "#facc15", "#fb7185", "#f472b6", "#e879f9"],
  },
  earthen: {
    id: "earthen",
    name: "Earthen",
    description: "Natural, muted earth tones",
    colors: ["#78716c", "#a8a29e", "#92400e", "#b45309", "#059669", "#047857", "#0369a1", "#0284c7"],
  },
};

// Default widget config per chart type
export const ANALYTICS_DEFAULT_WIDGET_CONFIGS: Record<string, Partial<IAnalyticsWidgetConfig>> = {
  bar: { color_preset: "modern", fill_opacity: 0.8, show_border: false, show_legend: true, show_tooltip: true },
  line: { color_preset: "modern", smoothing: true, show_markers: true, show_legend: true, show_tooltip: true },
  area: { color_preset: "modern", fill_opacity: 0.3, smoothing: true, show_legend: true, show_tooltip: true },
  donut: { color_preset: "modern", center_value: true, show_legend: true, show_tooltip: true },
  pie: { color_preset: "modern", show_legend: true, show_tooltip: true },
  number: { color_preset: "modern" },
};

// X-axis property options for widget data configuration
export const ANALYTICS_CHART_PROPERTY_OPTIONS = [
  { key: "priority", label: "Priority" },
  { key: "state", label: "State" },
  { key: "state_group", label: "State Group" },
  { key: "assignee", label: "Assignee" },
  { key: "labels", label: "Labels" },
  { key: "cycle", label: "Cycle" },
  { key: "module", label: "Module" },
  { key: "estimate_point", label: "Estimate Points" },
  { key: "start_date", label: "Start Date" },
  { key: "target_date", label: "Target Date" },
  { key: "created_at", label: "Created Date" },
  { key: "completed_at", label: "Completed Date" },
];

// Y-axis metric options for standard chart types (bar, line, area, donut, pie)
export const ANALYTICS_CHART_METRIC_OPTIONS = [
  { key: "count", label: "Issue Count" },
  { key: "estimate_points", label: "Estimate Points Sum" },
];

// Extended metric options for NUMBER widget type — matches backend METRICS_MAP keys exactly
export const ANALYTICS_NUMBER_METRIC_OPTIONS = [
  { key: "count", label: "Total Work Items" },
  { key: "estimate_points", label: "Estimate Points Sum" },
  { key: "PENDING_WORK_ITEMS", label: "Pending Work Items" },
  { key: "COMPLETED_WORK_ITEMS", label: "Completed Work Items" },
  { key: "IN_PROGRESS_WORK_ITEMS", label: "In Progress Work Items" },
  { key: "BLOCKED_WORK_ITEMS", label: "Blocked Work Items" },
  { key: "WORK_ITEMS_DUE_TODAY", label: "Work Items Due Today" },
  { key: "WORK_ITEMS_DUE_THIS_WEEK", label: "Work Items Due This Week" },
];

// Filter entity options for widget-level filtering UI
export const ANALYTICS_ENTITY_FILTER_OPTIONS = [
  { key: "priority", label: "Priority" },
  { key: "state", label: "State" },
  { key: "state_group", label: "State Group" },
  { key: "assignee", label: "Assignee" },
  { key: "labels", label: "Labels" },
  { key: "cycle", label: "Cycle" },
  { key: "module", label: "Module" },
] as const;

// Date field filter options
export const ANALYTICS_DATE_FILTER_OPTIONS = [
  { key: "start_date", label: "Start Date" },
  { key: "target_date", label: "Target Date" },
  { key: "created_at", label: "Created Date" },
  { key: "completed_at", label: "Completed Date" },
] as const;

// Hardcoded priority filter values
export const ANALYTICS_PRIORITY_OPTIONS = [
  { key: "urgent", label: "Urgent" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "none", label: "None" },
];

// Hardcoded state group filter values
export const ANALYTICS_STATE_GROUP_OPTIONS = [
  { key: "backlog", label: "Backlog" },
  { key: "unstarted", label: "Unstarted" },
  { key: "started", label: "Started" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// Default grid sizes per widget type (in grid units)
export const ANALYTICS_DEFAULT_WIDGET_SIZES: Record<string, { width: number; height: number }> = {
  bar: { width: 6, height: 4 },
  line: { width: 6, height: 4 },
  area: { width: 6, height: 4 },
  donut: { width: 4, height: 4 },
  pie: { width: 4, height: 4 },
  number: { width: 3, height: 2 },
};
