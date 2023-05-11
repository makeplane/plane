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
  cycle?: string | null;
  module?: string | null;
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

export interface IDefaultAnalyticsResponse {
  issue_completed_month_wise: { month: number; count: number }[];
  most_issue_closed_user: {
    assignees__avatar: string | null;
    assignees__email: string;
    count: number;
  }[];
  most_issue_created_user: {
    assignees__avatar: string | null;
    assignees__email: string;
    count: number;
  }[];
  open_estimate_sum: number;
  open_issues: number;
  open_issues_classified: { state_group: string; state_count: number }[];
  pending_issue_user: {
    assignees__avatar: string | null;
    assignees__email: string;
    count: number;
  }[];
  total_estimate_sum: number;
  total_issues: number;
  total_issues_classified: { state_group: string; state_count: number }[];
}
