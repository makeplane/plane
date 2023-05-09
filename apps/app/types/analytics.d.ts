export interface IAnalyticsResponse {
  total: number;
  distribution: IAnalyticsData;
  extras: {
    colors: IAnalyticsExtra[];
  };
}

export interface IAnalyticsData {
  [key: string]: {
    dimension: string | null;
    segment?: string;
    count?: number;
    effort?: number | null;
  }[];
}

export interface IAnalyticsExtra {
  name: string;
  color: string;
}

export type TXAxisValues =
  | "state__name"
  | "state__group"
  | "labels__name"
  | "assignees__email"
  | "estimate_point"
  | "issue_cycle__cycle__name"
  | "issue_module__module__name"
  | "priority"
  | "start_date"
  | "target_date"
  | "created_at"
  | "completed_at";

export type TYAxisValues = "issue_count" | "effort";

export interface IAnalyticsParams {
  x_axis: TXAxisValues;
  y_axis: TYAxisValues;
  segment?: TXAxisValues | null;
  project?: string | null;
}

export interface ISaveAnalyticsFormData {
  name: string;
  description: string;
  query_dict: IExportAnalyticsFormData;
}
export interface IExportAnalyticsFormData {
  x_axis: TXAxisValues;
  y_axis: TYAxisValues;
  segment?: TXAxisValues | null;
  project?: string[];
}
