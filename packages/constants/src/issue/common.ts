import type {
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  EIssuesStoreType,
} from "@plane/types";

export const ALL_ISSUES = "All Issues";

export type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

export type TIssueFilterPriorityObject = {
  key: TIssuePriorities;
  titleTranslationKey: string;
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
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
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

export const ISSUE_PRIORITIES: {
  key: TIssuePriorities;
  title: string;
}[] = [
  {
    key: "urgent",
    title: "Urgent",
  },
  {
    key: "high",
    title: "High",
  },
  {
    key: "medium",
    title: "Medium",
  },
  {
    key: "low",
    title: "Low",
  },
  {
    key: "none",
    title: "None",
  },
];

export const DRAG_ALLOWED_GROUPS: TIssueGroupByOptions[] = [
  "state",
  "priority",
  "assignees",
  "labels",
  "module",
  "cycle",
];

export type TCreateModalStoreTypes =
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.EPIC
  | EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS;

export const ISSUE_GROUP_BY_OPTIONS: {
  key: TIssueGroupByOptions;
  titleTranslationKey: string;
}[] = [
  { key: "state", titleTranslationKey: "common.states" },
  { key: "state_detail.group", titleTranslationKey: "common.state_groups" },
  { key: "priority", titleTranslationKey: "common.priority" },
  { key: "team_project", titleTranslationKey: "common.team_project" }, // required this on team issues
  { key: "project", titleTranslationKey: "common.project" }, // required this on my issues
  { key: "cycle", titleTranslationKey: "common.cycle" }, // required this on my issues
  { key: "module", titleTranslationKey: "common.module" }, // required this on my issues
  { key: "labels", titleTranslationKey: "common.labels" },
  { key: "assignees", titleTranslationKey: "common.assignees" },
  { key: "created_by", titleTranslationKey: "common.created_by" },
  { key: null, titleTranslationKey: "common.none" },
];

export const ISSUE_ORDER_BY_OPTIONS: {
  key: TIssueOrderByOptions;
  titleTranslationKey: string;
}[] = [
  { key: "sort_order", titleTranslationKey: "common.order_by.manual" },
  { key: "-created_at", titleTranslationKey: "common.order_by.last_created" },
  { key: "-updated_at", titleTranslationKey: "common.order_by.last_updated" },
  { key: "start_date", titleTranslationKey: "common.order_by.start_date" },
  { key: "target_date", titleTranslationKey: "common.order_by.due_date" },
  { key: "-priority", titleTranslationKey: "common.priority" },
];

export const ISSUE_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = [
  "assignee",
  "start_date",
  "due_date",
  "labels",
  "key",
  "priority",
  "state",
  "sub_issue_count",
  "link",
  "attachment_count",
  "estimate",
  "created_on",
  "updated_on",
  "modules",
  "cycle",
  "issue_type",
];

export const SUB_ISSUES_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = [
  "key",
  "assignee",
  "start_date",
  "due_date",
  "priority",
  "state",
];

export const ISSUE_DISPLAY_PROPERTIES: {
  key: keyof IIssueDisplayProperties;
  titleTranslationKey: string;
}[] = [
  {
    key: "key",
    titleTranslationKey: "issue.display.properties.id",
  },
  {
    key: "issue_type",
    titleTranslationKey: "issue.display.properties.issue_type",
  },
  {
    key: "assignee",
    titleTranslationKey: "common.assignee",
  },
  {
    key: "start_date",
    titleTranslationKey: "common.order_by.start_date",
  },
  {
    key: "due_date",
    titleTranslationKey: "common.order_by.due_date",
  },
  { key: "labels", titleTranslationKey: "common.labels" },
  {
    key: "priority",
    titleTranslationKey: "common.priority",
  },
  { key: "state", titleTranslationKey: "common.state" },
  {
    key: "sub_issue_count",
    titleTranslationKey: "issue.display.properties.sub_issue_count",
  },
  {
    key: "attachment_count",
    titleTranslationKey: "issue.display.properties.attachment_count",
  },
  { key: "link", titleTranslationKey: "common.link" },
  {
    key: "estimate",
    titleTranslationKey: "common.estimate",
  },
  { key: "modules", titleTranslationKey: "common.module" },
  { key: "cycle", titleTranslationKey: "common.cycle" },
];

export const SPREADSHEET_PROPERTY_LIST: (keyof IIssueDisplayProperties)[] = [
  "state",
  "priority",
  "assignee",
  "labels",
  "modules",
  "cycle",
  "start_date",
  "due_date",
  "estimate",
  "created_on",
  "updated_on",
  "link",
  "attachment_count",
  "sub_issue_count",
];

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key in keyof IIssueDisplayProperties]: {
    i18n_title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
    icon: string;
  };
} = {
  assignee: {
    i18n_title: "common.assignees",
    ascendingOrderKey: "assignees__first_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-assignees__first_name",
    descendingOrderTitle: "Z",
    icon: "MembersPropertyIcon",
  },
  created_on: {
    i18n_title: "common.sort.created_on",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Old",
    icon: "CalendarDays",
  },
  due_date: {
    i18n_title: "common.order_by.due_date",
    ascendingOrderKey: "-target_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "target_date",
    descendingOrderTitle: "Old",
    icon: "DueDatePropertyIcon",
  },
  estimate: {
    i18n_title: "common.estimate",
    ascendingOrderKey: "estimate_point__key",
    ascendingOrderTitle: "Low",
    descendingOrderKey: "-estimate_point__key",
    descendingOrderTitle: "High",
    icon: "EstimatePropertyIcon",
  },
  labels: {
    i18n_title: "common.labels",
    ascendingOrderKey: "labels__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-labels__name",
    descendingOrderTitle: "Z",
    icon: "LabelPropertyIcon",
  },
  modules: {
    i18n_title: "common.modules",
    ascendingOrderKey: "issue_module__module__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-issue_module__module__name",
    descendingOrderTitle: "Z",
    icon: "DiceIcon",
  },
  cycle: {
    i18n_title: "common.cycle",
    ascendingOrderKey: "issue_cycle__cycle__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-issue_cycle__cycle__name",
    descendingOrderTitle: "Z",
    icon: "ContrastIcon",
  },
  priority: {
    i18n_title: "common.priority",
    ascendingOrderKey: "priority",
    ascendingOrderTitle: "None",
    descendingOrderKey: "-priority",
    descendingOrderTitle: "Urgent",
    icon: "PriorityPropertyIcon",
  },
  start_date: {
    i18n_title: "common.order_by.start_date",
    ascendingOrderKey: "-start_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "start_date",
    descendingOrderTitle: "Old",
    icon: "StartDatePropertyIcon",
  },
  state: {
    i18n_title: "common.state",
    ascendingOrderKey: "state__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-state__name",
    descendingOrderTitle: "Z",
    icon: "StatePropertyIcon",
  },
  updated_on: {
    i18n_title: "common.sort.updated_on",
    ascendingOrderKey: "-updated_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "updated_at",
    descendingOrderTitle: "Old",
    icon: "CalendarDays",
  },
  link: {
    i18n_title: "common.link",
    ascendingOrderKey: "-link_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "link_count",
    descendingOrderTitle: "Least",
    icon: "Link2",
  },
  attachment_count: {
    i18n_title: "common.attachment",
    ascendingOrderKey: "-attachment_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "attachment_count",
    descendingOrderTitle: "Least",
    icon: "Paperclip",
  },
  sub_issue_count: {
    i18n_title: "issue.display.properties.sub_issue",
    ascendingOrderKey: "-sub_issues_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "sub_issues_count",
    descendingOrderTitle: "Least",
    icon: "LayersIcon",
  },
};

// Map filter keys to their corresponding issue property keys
export const FILTER_TO_ISSUE_MAP: Partial<Record<keyof IIssueFilterOptions, keyof TIssue>> = {
  assignees: "assignee_ids",
  created_by: "created_by",
  labels: "label_ids",
  priority: "priority",
  cycle: "cycle_id",
  module: "module_ids",
  project: "project_id",
  state: "state_id",
  issue_type: "type_id",
  state_group: "state__group",
} as const;
