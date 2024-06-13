import type { TIssue, IIssueFilterOptions } from "@plane/types";

export type TCycleGroups = "current" | "upcoming" | "completed" | "draft";

export type TCycleCompletionChartDistribution = {
  [key: string]: number | null;
};

export type TCycleDistributionBase = {
  total_issues: number;
  pending_issues: number;
  completed_issues: number;
};

export type TCycleEstimateDistributionBase = {
  total_estimates: number;
  pending_estimates: number;
  completed_estimates: number;
};

export type TCycleAssigneesDistribution = {
  assignee_id: string | null;
  avatar: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

export type TCycleLabelsDistribution = {
  color: string | null;
  label_id: string | null;
  label_name: string | null;
};

export type TCycleDistribution = {
  assignees: (TCycleAssigneesDistribution & TCycleDistributionBase)[];
  completion_chart: TCycleCompletionChartDistribution;
  labels: (TCycleLabelsDistribution & TCycleDistributionBase)[];
};

export type TCycleEstimateDistribution = {
  assignees: (TCycleAssigneesDistribution & TCycleEstimateDistributionBase)[];
  completion_chart: TCycleCompletionChartDistribution;
  labels: (TCycleLabelsDistribution & TCycleEstimateDistributionBase)[];
};

export type TProgressSnapshot = {
  total_issues: number;
  completed_issues: number;
  backlog_issues: number;
  started_issues: number;
  unstarted_issues: number;
  cancelled_issues: number;
  total_estimate_points?: number;
  completed_estimate_points?: number;
  backlog_estimate_points: number;
  started_estimate_points: number;
  unstarted_estimate_points: number;
  cancelled_estimate_points: number;
  distribution?: TCycleDistribution;
  estimate_distribution?: TCycleEstimateDistribution;
};

export interface ICycle extends TProgressSnapshot {
  progress_snapshot: TProgressSnapshot | undefined;

  created_at?: string;
  created_by?: string;
  description: string;
  end_date: string | null;
  id: string;
  is_favorite?: boolean;
  name: string;
  owned_by_id: string;
  project_id: string;
  status?: TCycleGroups;
  sort_order: number;
  start_date: string | null;
  sub_issues?: number;
  updated_at?: string;
  updated_by?: string;
  archived_at: string | null;
  assignee_ids?: string[];
  view_props: {
    filters: IIssueFilterOptions;
  };
  workspace_id: string;
}

export interface CycleIssueResponse {
  id: string;
  issue_detail: TIssue;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  cycle: string;
  sub_issues_count: number;
}

export type SelectCycleType =
  | (ICycle & { actionType: "edit" | "delete" | "create-issue" })
  | undefined;

export type CycleDateCheckData = {
  start_date: string;
  end_date: string;
  cycle_id?: string;
};

export type TCyclePlotType = "burndown" | "points";
