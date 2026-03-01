/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Custom Dashboard types (V2 — CE workspace-level analytics dashboards)

export interface IDashboard {
  id: string;
  name: string;
  description: string | null;
  projects: string[];
  filters: Record<string, unknown>;
  logo_props: Record<string, unknown>;
  access: number;
  workspace: string;
  widgets: IDashboardWidget[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface IDashboardWidget {
  id: string;
  name: string;
  chart_type: string;
  chart_model: string;
  x_axis_property: string;
  y_axis_metric: string;
  group_by: string | null;
  config: Record<string, unknown>;
  filters: Record<string, unknown>;
  x_axis_coord: number;
  y_axis_coord: number;
  width: number;
  height: number;
  dashboard: string;
  workspace: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface IDashboardChartDataPoint {
  name: string;
  count: number;
  [key: string]: string | number;
}

export interface IDashboardChartResponse {
  data: IDashboardChartDataPoint[];
}

export type TDashboardCreate = Pick<IDashboard, "name" | "description" | "access"> & {
  project_ids?: string[];
};
export type TDashboardUpdate = Partial<TDashboardCreate>;

export type TDashboardWidgetCreate = Pick<
  IDashboardWidget,
  "name" | "chart_type" | "chart_model" | "x_axis_property" | "y_axis_metric" | "config" | "width" | "height"
>;
export type TDashboardWidgetUpdate = Partial<TDashboardWidgetCreate> & {
  group_by?: string | null;
  filters?: Record<string, unknown>;
  x_axis_coord?: number;
  y_axis_coord?: number;
};

// Widget config types used by the config UI components
export interface IAnalyticsDateRangeFilter {
  after?: string; // ISO 8601 YYYY-MM-DD
  before?: string;
}

export interface IAnalyticsWidgetFilters {
  priority?: string[];
  state?: string[];
  state_group?: string[];
  assignee?: string[];
  labels?: string[];
  cycle?: string[];
  module?: string[];
  start_date?: IAnalyticsDateRangeFilter;
  target_date?: IAnalyticsDateRangeFilter;
  created_at?: IAnalyticsDateRangeFilter;
  completed_at?: IAnalyticsDateRangeFilter;
}

export interface IAnalyticsWidgetConfig {
  color_preset: string;
  fill_opacity?: number;
  show_border?: boolean;
  smoothing?: boolean;
  show_legend?: boolean;
  show_tooltip?: boolean;
  center_value?: boolean;
  show_markers?: boolean;
  filters?: IAnalyticsWidgetFilters;
  // M2: line type for LINE_CHART
  line_type?: "solid" | "dashed" | "stepped";
  // M1: bar orientation for BAR_CHART
  orientation?: "vertical" | "horizontal";
  // M4: number widget display
  text_align?: "left" | "center" | "right";
  text_color?: string;
}

export interface IAnalyticsColorPreset {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

export interface IAnalyticsChartData {
  data: Array<Record<string, string | number>>;
  schema: Record<string, string>;
}

export interface IAnalyticsNumberWidgetData {
  value: number;
  metric: string;
}

// Alias for backward compatibility — widget config form uses this
export type IAnalyticsWidgetConfigForm = IAnalyticsWidgetConfig;
