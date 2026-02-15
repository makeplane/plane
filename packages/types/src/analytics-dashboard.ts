/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Analytics Dashboard interfaces (Pro feature)

export interface IAnalyticsDashboard {
  id: string;
  workspace: string;
  name: string;
  description: string | null;
  logo_props: Record<string, any>;
  owner: string;
  is_default: boolean;
  sort_order: number;
  config: IAnalyticsDashboardConfig;
  widget_count: number;
  created_at: string;
  updated_at: string;
}

export interface IAnalyticsDashboardConfig {
  project_ids: string[];
  layout?: { columns?: number; rowHeight?: number };
  filters?: Record<string, any>;
}

export enum EAnalyticsWidgetType {
  BAR = "bar",
  LINE = "line",
  AREA = "area",
  DONUT = "donut",
  PIE = "pie",
  NUMBER = "number",
}

export interface IAnalyticsDashboardWidget {
  id: string;
  dashboard: string;
  widget_type: EAnalyticsWidgetType;
  title: string;
  chart_property: string;
  chart_metric: string;
  config: IAnalyticsWidgetConfig;
  position: IAnalyticsWidgetPosition;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  filters?: Record<string, any>;
}

export interface IAnalyticsWidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface IAnalyticsColorPreset {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

export interface IAnalyticsChartData {
  data: Array<Record<string, any>>;
  schema: Record<string, string>;
}

export interface IAnalyticsNumberWidgetData {
  value: number;
  metric: string;
}

export interface IAnalyticsDashboardDetail extends IAnalyticsDashboard {
  widgets: IAnalyticsDashboardWidget[];
}

export type TAnalyticsDashboardCreate = Pick<IAnalyticsDashboard, "name" | "description" | "logo_props" | "config">;
export type TAnalyticsDashboardUpdate = Partial<TAnalyticsDashboardCreate> & { is_default?: boolean; sort_order?: number };
export type TAnalyticsWidgetCreate = Pick<IAnalyticsDashboardWidget, "widget_type" | "title" | "chart_property" | "chart_metric" | "config" | "position">;
export type TAnalyticsWidgetUpdate = Partial<TAnalyticsWidgetCreate> & { sort_order?: number };
