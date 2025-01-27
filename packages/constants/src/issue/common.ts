import {
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  IIssueDisplayProperties,
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

export enum EIssueServiceType {
  ISSUES = "issues",
  EPICS = "epics",
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
  | EIssuesStoreType.EPIC;

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

export const ISSUE_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] =
  [
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
