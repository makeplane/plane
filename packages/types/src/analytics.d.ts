import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/constants";
import { TChartData } from "./charts";
import { Row } from "@tanstack/react-table";

export type TAnalyticsTabsBase = "overview" | "work-items";
export type TAnalyticsGraphsBase = "projects" | "work-items" | "custom-work-items";
export type TAnalyticsFilterParams = {
  project_ids?: string;
  cycle_id?: string;
  module_id?: string;
};

// service types

export interface IAnalyticsResponse {
  [key: string]: any;
}

export interface IAnalyticsResponseFields {
  count: number;
  filter_count: number;
}

// chart types

export interface IChartResponse {
  schema: Record<string, string>;
  data: TChartData<string, string>[];
}

// table types

export interface WorkItemInsightColumns {
  project_id?: string;
  project__name?: string;
  cancelled_work_items: number;
  completed_work_items: number;
  backlog_work_items: number;
  un_started_work_items: number;
  started_work_items: number;
  // incase of peek view, we will display the display_name instead of project__name
  display_name?: string;
  avatar_url?: string;
  assignee_id?: string;
}

export type AnalyticsTableDataMap = {
  "work-items": WorkItemInsightColumns;
};

export interface IAnalyticsParams {
  x_axis: ChartXAxisProperty;
  y_axis: ChartYAxisMetric;
  group_by?: ChartXAxisProperty;
}

export type ExportConfig<T> = {
  key: string;
  value: (row: Row<T>) => string | number;
  label?: string;
};
