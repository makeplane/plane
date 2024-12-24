import { List, Kanban } from "lucide-react";

export const ALL_ISSUES = "All Issues";

export type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

export type TIssueFilterKeys = "priority" | "state" | "labels";

export type TIssueLayout =
  | "list"
  | "kanban"
  | "calendar"
  | "spreadsheet"
  | "gantt";

export type TIssueFilterPriorityObject = {
  key: TIssuePriorities;
  title: string;
  className: string;
  icon: string;
};

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

export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [key in TIssueLayout]: Record<"filters", TIssueFilterKeys[]>;
} = {
  list: {
    filters: ["priority", "state", "labels"],
  },
  kanban: {
    filters: ["priority", "state", "labels"],
  },
  calendar: {
    filters: ["priority", "state", "labels"],
  },
  spreadsheet: {
    filters: ["priority", "state", "labels"],
  },
  gantt: {
    filters: ["priority", "state", "labels"],
  },
};

export const ISSUE_PRIORITIES: {
  key: TIssuePriorities;
  title: string;
}[] = [
  { key: "urgent", title: "Urgent" },
  { key: "high", title: "High" },
  { key: "medium", title: "Medium" },
  { key: "low", title: "Low" },
  { key: "none", title: "None" },
];

export const ISSUE_PRIORITY_FILTERS: TIssueFilterPriorityObject[] = [
  {
    key: "urgent",
    title: "Urgent",
    className: "bg-red-500 border-red-500 text-white",
    icon: "error",
  },
  {
    key: "high",
    title: "High",
    className: "text-orange-500 border-custom-border-300",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    title: "Medium",
    className: "text-yellow-500 border-custom-border-300",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    title: "Low",
    className: "text-green-500 border-custom-border-300",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    title: "None",
    className: "text-gray-500 border-custom-border-300",
    icon: "block",
  },
];

export const SITES_ISSUE_LAYOUTS: {
  key: TIssueLayout;
  title: string;
  icon: any;
}[] = [
  { key: "list", title: "List", icon: List },
  { key: "kanban", title: "Kanban", icon: Kanban },
  // { key: "calendar", title: "Calendar", icon: Calendar },
  // { key: "spreadsheet", title: "Spreadsheet", icon: Sheet },
  // { key: "gantt", title: "Gantt chart", icon: GanttChartSquare },
];
