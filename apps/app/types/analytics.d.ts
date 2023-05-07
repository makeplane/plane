export interface IAnalytics {
  total: number;
  distribution: IAnalyticsData;
}

export interface IAnalyticsData {
  [key: string]: {
    dimension: string | null;
    segment?: string;
    count?: number;
    effort: number | null;
  }[];
}

export type TXAxisValues =
  | "state__name"
  | "state__group"
  | "labels__name"
  | "assignees__email"
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
  project_id?: string | null;
}
