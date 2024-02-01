import type {
  IUser,
  TIssue,
  IProjectLite,
  IWorkspaceLite,
  IIssueFilterOptions,
  IUserLite,
} from "@plane/types";

export type TCycleView = "all" | "active" | "upcoming" | "completed" | "draft";

export type TCycleGroups = "current" | "upcoming" | "completed" | "draft";

export type TCycleLayout = "list" | "board" | "gantt";

export interface ICycle {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  created_at: Date;
  created_by: string;
  description: string;
  distribution?: {
    assignees: TAssigneesDistribution[];
    completion_chart: TCompletionChartDistribution;
    labels: TLabelsDistribution[];
  };
  end_date: string | null;
  id: string;
  is_favorite: boolean;
  issue: string;
  name: string;
  owned_by: string;
  project: string;
  project_detail: IProjectLite;
  status: TCycleGroups;
  sort_order: number;
  start_date: string | null;
  started_issues: number;
  total_issues: number;
  unstarted_issues: number;
  updated_at: Date;
  updated_by: string;
  assignees: IUserLite[];
  view_props: {
    filters: IIssueFilterOptions;
  };
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export type TAssigneesDistribution = {
  assignee_id: string | null;
  avatar: string | null;
  completed_issues: number;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  pending_issues: number;
  total_issues: number;
};

export type TCompletionChartDistribution = {
  [key: string]: number | null;
};

export type TLabelsDistribution = {
  color: string | null;
  completed_issues: number;
  label_id: string | null;
  label_name: string | null;
  pending_issues: number;
  total_issues: number;
};

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

export type SelectIssue =
  | (TIssue & { actionType: "edit" | "delete" | "create" })
  | null;

export type CycleDateCheckData = {
  start_date: string;
  end_date: string;
  cycle_id?: string;
};
