export interface IAnalyticsResponse {
  total: number;
  distribution: IAnalyticsData;
  extras: {
    colors: IAnalyticsExtra[];
    assignee_details: {
      assignees__display_name: string | null;
      assignees__avatar: string | null;
      assignees__first_name: string;
      assignees__last_name: string;
    }[];
  };
}

export interface IAnalyticsData {
  [key: string]: {
    dimension: string | null;
    segment?: string;
    count?: number;
    estimate?: number | null;
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
  | "assignees__id"
  | "estimate_point"
  | "issue_cycle__cycle__name"
  | "issue_module__module__name"
  | "priority"
  | "start_date"
  | "target_date"
  | "created_at"
  | "completed_at";

export type TYAxisValues = "issue_count" | "estimate";

export interface IAnalyticsParams {
  x_axis: TXAxisValues;
  y_axis: TYAxisValues;
  segment?: TXAxisValues | null;
  project?: string[] | null;
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

export interface IDefaultAnalyticsUser {
  assignees__avatar: string | null;
  assignees__first_name: string;
  assignees__last_name: string;
  assignees__display_name: string;
  count: number;
}

export interface IDefaultAnalyticsResponse {
  issue_completed_month_wise: { month: number; count: number }[];
  most_issue_closed_user: IDefaultAnalyticsUser[];
  most_issue_created_user: {
    created_by__avatar: string | null;
    created_by__first_name: string;
    created_by__last_name: string;
    created_by__display_name: string;
    count: number;
  }[];
  open_estimate_sum: number;
  open_issues: number;
  open_issues_classified: { state_group: string; state_count: number }[];
  pending_issue_user: IDefaultAnalyticsUser[];
  total_estimate_sum: number;
  total_issues: number;
  total_issues_classified: { state_group: string; state_count: number }[];
}
