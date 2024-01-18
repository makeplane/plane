import { IIssueActivity, TIssuePriorities } from "./issues";
import { TIssue } from "./issues/issue";
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

export type TIssuesListTypes = "upcoming" | "overdue" | "completed";

export type TDurationFilterOptions =
  | "today"
  | "this_week"
  | "this_month"
  | "this_year";

// widget filters
export type TAssignedIssuesWidgetFilters = {
  target_date?: TDurationFilterOptions;
  tab?: TIssuesListTypes;
};

export type TCreatedIssuesWidgetFilters = {
  target_date?: TDurationFilterOptions;
  tab?: TIssuesListTypes;
};

export type TIssuesByStateGroupsWidgetFilters = {
  target_date?: TDurationFilterOptions;
};

export type TIssuesByPriorityWidgetFilters = {
  target_date?: TDurationFilterOptions;
};

export type TWidgetFiltersFormData =
  | {
      widgetKey: "assigned_issues";
      filters: Partial<TAssignedIssuesWidgetFilters>;
    }
  | {
      widgetKey: "created_issues";
      filters: Partial<TCreatedIssuesWidgetFilters>;
    }
  | {
      widgetKey: "issues_by_state_groups";
      filters: Partial<TIssuesByStateGroupsWidgetFilters>;
    }
  | {
      widgetKey: "issues_by_priority";
      filters: Partial<TIssuesByPriorityWidgetFilters>;
    };

export type TWidget = {
  id: string;
  is_visible: boolean;
  key: TWidgetKeys;
  readonly widget_filters: // only for read
  TAssignedIssuesWidgetFilters &
    TCreatedIssuesWidgetFilters &
    TIssuesByStateGroupsWidgetFilters &
    TIssuesByPriorityWidgetFilters;
  filters: // only for write
  TAssignedIssuesWidgetFilters &
    TCreatedIssuesWidgetFilters &
    TIssuesByStateGroupsWidgetFilters &
    TIssuesByPriorityWidgetFilters;
};

export type TWidgetStatsRequestParams =
  | {
      widget_key: TWidgetKeys;
    }
  | {
      target_date: string;
      issue_type: TIssuesListTypes;
      widget_key: "assigned_issues";
      expand?: "issue_relation";
    }
  | {
      target_date: string;
      issue_type: TIssuesListTypes;
      widget_key: "created_issues";
    }
  | {
      target_date: string;
      widget_key: "issues_by_state_groups";
    }
  | {
      target_date: string;
      widget_key: "issues_by_priority";
    };

export type TWidgetIssue = TIssue & {
  issue_relation: {
    id: string;
    project_id: string;
    relation_type: TIssueRelationTypes;
    sequence_id: number;
  }[];
};

// widget stats responses
export type TOverviewStatsWidgetResponse = {
  assigned_issues_count: number;
  completed_issues_count: number;
  created_issues_count: number;
  pending_issues_count: number;
};

export type TAssignedIssuesWidgetResponse = {
  issues: TWidgetIssue[];
  count: number;
};

export type TCreatedIssuesWidgetResponse = {
  issues: TWidgetIssue[];
  count: number;
};

export type TIssuesByStateGroupsWidgetResponse = {
  count: number;
  state: TStateGroups;
};

export type TIssuesByPriorityWidgetResponse = {
  count: number;
  priority: TIssuePriorities;
};

export type TRecentActivityWidgetResponse = IIssueActivity;

export type TRecentProjectsWidgetResponse = string[];

export type TRecentCollaboratorsWidgetResponse = {
  active_issue_count: number;
  user_id: string;
};

export type TWidgetStatsResponse =
  | TOverviewStatsWidgetResponse
  | TIssuesByStateGroupsWidgetResponse[]
  | TIssuesByPriorityWidgetResponse[]
  | TAssignedIssuesWidgetResponse
  | TCreatedIssuesWidgetResponse
  | TRecentActivityWidgetResponse[]
  | TRecentProjectsWidgetResponse
  | TRecentCollaboratorsWidgetResponse[];

// dashboard
export type TDashboard = {
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
};

export type THomeDashboardResponse = {
  dashboard: TDashboard;
  widgets: TWidget[];
};
