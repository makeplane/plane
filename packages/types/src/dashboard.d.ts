import { TIssuePriorities } from "./issues";
import { TIssueRelationTypes } from "./issues/issue_relation";
import { TStateGroups } from "./state";

export type TWidgetKeys =
  | "overview_stats"
  | "assigned_issues"
  | "created_issues"
  | "issues_by_state_groups"
  | "issues_by_priority"
  | "recent_activity"
  | "recent_projects"
  | "recent_collaborators";

export interface IWidget {
  id: string;
  is_visible: boolean;
  filters: Object;
  key: TWidgetKeys;
}

export interface IOverviewStatsWidgetResponse {
  assigned_issues_count: number;
  completed_issues_count: number;
  created_issues_count: number;
  pending_issues_count: number;
}

export interface IIssuesByStateGroupsWidgetResponse {
  count: number;
  state__group: TStateGroups;
}

export interface IIssuesByPriorityWidgetResponse {
  count: number;
  priority: TIssuePriorities;
}

export interface IWidgetIssue {
  assignees: string[];
  id: string;
  name: string;
  priority: TIssuePriorities;
  project: string;
  related_issues: {
    id: string;
    project_id: string;
    relation_type: TIssueRelationTypes;
    sequence_id: number;
  }[];
  sequence_id: number;
  state: string;
  target_date: string | null;
  workspace: string;
}

export interface IAssignedIssuesWidgetResponse {
  completed_issues: IWidgetIssue[];
  completed_issues_count: number;
  overdue_issues: IWidgetIssue[];
  overdue_issues_count: number;
  upcoming_issues: IWidgetIssue[];
  upcoming_issues_count: number;
}

export interface ICreatedIssuesWidgetResponse {
  completed_issues: IWidgetIssue[];
  completed_issues_count: number;
  overdue_issues: IWidgetIssue[];
  overdue_issues_count: number;
  upcoming_issues: IWidgetIssue[];
  upcoming_issues_count: number;
}

export type IRecentProjectsWidgetResponse = string[];

export interface IRecentCollaboratorsWidgetResponse {
  active_issue_count: number;
  user_id: string;
}

export type IWidgetStatsResponse =
  | IOverviewStatsWidgetResponse
  | IIssuesByStateGroupsWidgetResponse[]
  | IIssuesByPriorityWidgetResponse[]
  | IAssignedIssuesWidgetResponse
  | ICreatedIssuesWidgetResponse
  | IRecentProjectsWidgetResponse
  | IRecentCollaboratorsWidgetResponse[];

export interface IDashboard {
  created_at: string;
  created_by: string | null;
  description_html: string;
  id: string;
  identifier: string | null;
  is_default: boolean;
  name: string;
  owned_by: string;
  type: string;
  updated_at: string;
  updated_by: string | null;
}

export interface IHomeDashboardResponse {
  dashboard: IDashboard;
  widgets: IWidget[];
}
