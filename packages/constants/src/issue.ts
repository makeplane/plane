export const ALL_ISSUES = "All Issues";

export enum EIssueGroupByToServerOptions {
  "state" = "state_id",
  "priority" = "priority",
  "labels" = "labels__id",
  "state_detail.group" = "state__group",
  "assignees" = "assignees__id",
  "cycle" = "cycle_id",
  "module" = "issue_module__module_id",
  "target_date" = "target_date",
  "project" = "project_id",
  "created_by" = "created_by",
  "team_project" = "project_id",
}

export enum EIssueGroupBYServerToProperty {
  "state_id" = "state_id",
  "priority" = "priority",
  "labels__id" = "label_ids",
  "state__group" = "state__group",
  "assignees__id" = "assignee_ids",
  "cycle_id" = "cycle_id",
  "issue_module__module_id" = "module_ids",
  "target_date" = "target_date",
  "project_id" = "project_id",
  "created_by" = "created_by",
}

export enum EServerGroupByToFilterOptions {
  "state_id" = "state",
  "priority" = "priority",
  "labels__id" = "labels",
  "state__group" = "state_group",
  "assignees__id" = "assignees",
  "cycle_id" = "cycle",
  "issue_module__module_id" = "module",
  "target_date" = "target_date",
  "project_id" = "project",
  "created_by" = "created_by",
}

export enum EIssueServiceType {
  ISSUES = "issues",
  EPICS = "epics",
}

export enum EIssueLayoutTypes {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  GANTT = "gantt_chart",
  SPREADSHEET = "spreadsheet",
}

export enum EIssuesStoreType {
  GLOBAL = "GLOBAL",
  PROFILE = "PROFILE",
  TEAM = "TEAM",
  PROJECT = "PROJECT",
  CYCLE = "CYCLE",
  MODULE = "MODULE",
  TEAM_VIEW = "TEAM_VIEW",
  PROJECT_VIEW = "PROJECT_VIEW",
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  DEFAULT = "DEFAULT",
  WORKSPACE_DRAFT = "WORKSPACE_DRAFT",
  EPIC = "EPIC",
}

export enum EIssueFilterType {
  FILTERS = "filters",
  DISPLAY_FILTERS = "display_filters",
  DISPLAY_PROPERTIES = "display_properties",
  KANBAN_FILTERS = "kanban_filters",
}

export enum EIssueCommentAccessSpecifier {
  EXTERNAL = "EXTERNAL",
  INTERNAL = "INTERNAL",
}

export enum EIssueListRow {
  HEADER = "HEADER",
  ISSUE = "ISSUE",
  NO_ISSUES = "NO_ISSUES",
  QUICK_ADD = "QUICK_ADD",
}
