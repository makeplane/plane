// types
import {
  TStateGroups,
  TIssuePriorities,
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayFiltersGrouped,
  TViewDisplayFiltersOrderBy,
  TViewDisplayFiltersType,
} from "@plane/types";

// filters constants
export const STATE_GROUP_PROPERTY: Record<TStateGroups, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#d9d9d9" },
  unstarted: { label: "Unstarted", color: "#3f76ff" },
  started: { label: "Started", color: "#f59e0b" },
  completed: { label: "Completed", color: "#16a34a" },
  cancelled: { label: "Canceled", color: "#dc2626" },
};

export const PRIORITIES_PROPERTY: Record<TIssuePriorities, { label: string }> = {
  urgent: { label: "Urgent" },
  high: { label: "High" },
  medium: { label: "Medium" },
  low: { label: "Low" },
  none: { label: "None" },
};

export const DATE_PROPERTY: Record<string, { label: string }> = {
  "1_weeks;after;fromnow": { label: "1 week from now" },
  "2_weeks;after;fromnow": { label: "2 weeks from now" },
  "1_months;after;fromnow": { label: "1 month from now" },
  "2_months;after;fromnow": { label: "2 months from now" },
  custom: { label: "Custom" },
};

// display filter constants
export const GROUP_BY_PROPERTY: Partial<Record<TViewDisplayFiltersGrouped | "null", { label: string }>> = {
  state: { label: "states" },
  priority: { label: "Priority" },
  labels: { label: "labels" },
  assignees: { label: "Assignees" },
  created_by: { label: "Created By" },
  cycles: { label: "Cycles" },
  modules: { label: "Modules" },
  null: { label: "None" },
};

export const ORDER_BY_PROPERTY: Partial<Record<TViewDisplayFiltersOrderBy, Record<string, string>>> = {
  sort_order: { label: "Manual" },
  "-created_at": { label: "Last Created" },
  "-updated_at": { label: "Last Updated" },
  start_date: { label: "Start Date" },
  target_date: { label: "Due Date" },
  "-priority": { label: "Priority" },
};

export const TYPE_PROPERTY: Record<TViewDisplayFiltersType | "null", { label: string }> = {
  null: { label: "All" },
  active: { label: "Active issues" },
  backlog: { label: "Backlog issues" },
};

export const EXTRA_OPTIONS_PROPERTY: Record<string, { label: string }> = {
  sub_issue: { label: "Sub Issues" },
  show_empty_groups: { label: "Show Empty Groups" },
};

export enum EViewPageType {
  ALL = "all",
  PROFILE = "profile",
  PROJECT = "project",
  ARCHIVED = "archived",
  DRAFT = "draft",
}

export enum EViewLayouts {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  SPREADSHEET = "spreadsheet",
  GANTT = "gantt",
}

export type TViewLayoutFilterProperties = {
  filters: Partial<keyof TViewFilters>[];
  display_filters: Partial<keyof TViewDisplayFilters>[];
  extra_options: ("sub_issue" | "show_empty_groups")[];
  display_properties: boolean;
  readonlyFilters?: Partial<keyof TViewFilters>[];
};

export type TViewLayoutFilters = {
  layouts: Partial<EViewLayouts>[];
  [EViewLayouts.LIST]: TViewLayoutFilterProperties;
  [EViewLayouts.KANBAN]: TViewLayoutFilterProperties;
  [EViewLayouts.CALENDAR]: TViewLayoutFilterProperties;
  [EViewLayouts.SPREADSHEET]: TViewLayoutFilterProperties;
  [EViewLayouts.GANTT]: TViewLayoutFilterProperties;
};

export type TFilterPermissions = {
  [EViewPageType.ALL]: Partial<TViewLayoutFilters>;
  [EViewPageType.PROFILE]: Partial<TViewLayoutFilters>;
  [EViewPageType.PROJECT]: TViewLayoutFilters;
  [EViewPageType.ARCHIVED]: Partial<TViewLayoutFilters>;
  [EViewPageType.DRAFT]: Partial<TViewLayoutFilters>;
};

const ALL_FILTER_PERMISSIONS: TFilterPermissions["all"] = {
  layouts: [EViewLayouts.SPREADSHEET],
  [EViewLayouts.SPREADSHEET]: {
    filters: ["project", "priority", "state_group", "assignees", "created_by", "labels", "start_date", "target_date"],
    display_filters: ["type"],
    // extra_options: [],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
};

const PROFILE_FILTER_PERMISSIONS: TFilterPermissions["profile"] = {
  layouts: [EViewLayouts.LIST, EViewLayouts.KANBAN],
  [EViewLayouts.LIST]: {
    filters: ["priority", "state_group", "labels", "start_date", "target_date"],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
  [EViewLayouts.KANBAN]: {
    filters: ["priority", "state_group", "labels", "start_date", "target_date"],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
};

const PROJECT_FILTER_PERMISSIONS: TFilterPermissions["project"] = {
  layouts: [
    EViewLayouts.LIST,
    EViewLayouts.KANBAN,
    EViewLayouts.CALENDAR,
    EViewLayouts.SPREADSHEET,
    EViewLayouts.GANTT,
  ],
  [EViewLayouts.LIST]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  [EViewLayouts.KANBAN]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "sub_group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  [EViewLayouts.CALENDAR]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["type"],
    extra_options: ["sub_issue"],
    display_properties: true,
  },
  [EViewLayouts.SPREADSHEET]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
  [EViewLayouts.GANTT]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["order_by", "type"],
    extra_options: ["sub_issue"],
    display_properties: false,
  },
};

const ARCHIVED_FILTER_PERMISSIONS: TFilterPermissions["archived"] = {
  layouts: [EViewLayouts.LIST],
  [EViewLayouts.LIST]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by"],
    extra_options: [],
    display_properties: true,
  },
};

const DRAFT_FILTER_PERMISSIONS: TFilterPermissions["draft"] = {
  layouts: [EViewLayouts.LIST, EViewLayouts.KANBAN],
  [EViewLayouts.LIST]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  [EViewLayouts.KANBAN]: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "sub_group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
};

export const VIEW_DEFAULT_FILTER_PARAMETERS: TFilterPermissions = {
  [EViewPageType.ALL]: ALL_FILTER_PERMISSIONS,
  [EViewPageType.PROFILE]: PROFILE_FILTER_PERMISSIONS,
  [EViewPageType.PROJECT]: PROJECT_FILTER_PERMISSIONS,
  [EViewPageType.ARCHIVED]: ARCHIVED_FILTER_PERMISSIONS,
  [EViewPageType.DRAFT]: DRAFT_FILTER_PERMISSIONS,
};

export const viewPageDefaultLayoutsByPageType = (_viewPageType: EViewPageType) =>
  VIEW_DEFAULT_FILTER_PARAMETERS?.[_viewPageType]?.layouts || [];

export const viewDefaultFilterParametersByViewTypeAndLayout = <K extends keyof TViewLayoutFilterProperties>(
  _viewPageType: EViewPageType,
  _layout: EViewLayouts,
  property: K
): TViewLayoutFilterProperties[K] =>
  VIEW_DEFAULT_FILTER_PARAMETERS?.[_viewPageType]?.[_layout]?.[property] as TViewLayoutFilterProperties[K];
