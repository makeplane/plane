import type {
  IUser,
  IIssue,
  IProject,
  IProjectLite,
  IWorkspace,
  IWorkspaceLite,
  IIssueFilterOptions,
  IUserLite,
} from "types";

export interface ICycle {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  created_at: Date;
  created_by: string;
  description: string;
  end_date: string | null;
  id: string;
  is_favorite: boolean;
  issue: string;
  name: string;
  owned_by: IUser;
  project: string;
  project_detail: IProjectLite;
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

export interface CycleIssueResponse {
  id: string;
  issue_detail: IIssue;
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

export type SelectIssue = (IIssue & { actionType: "edit" | "delete" | "create" }) | null;
