/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  EIssuesStoreType,
  TIssueFrequency,
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
];

export const ISSUE_FREQUENCIES: {
  key: TIssueFrequency;
  title: string;
  color: string;
}[] = [
  { key: "daily", title: "Daily", color: "#ef4444" },
  { key: "weekly", title: "Weekly", color: "#f97316" },
  { key: "bi_weekly", title: "Bi-weekly", color: "#eab308" },
  { key: "monthly", title: "Monthly", color: "#22c55e" },
  { key: "quarterly", title: "Quarterly", color: "#3b82f6" },
  { key: "half_year", title: "Half-year", color: "#8b5cf6" },
  { key: "yearly", title: "Yearly", color: "#6366f1" },
  { key: "ad_hoc", title: "Ad-hoc", color: "#6b7280" },
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
  "progress_tracking",
  // CE extended display properties
  "department_name",
  "project_name",
  "project_lead",
  "bank_wide_project",
  "main_task_category",
  "sub_task_category",
  "completed_date",
  "reference_link",
  "total_log_time",
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
  { key: "progress_tracking", titleTranslationKey: "spreadsheet.columns.progress_tracking" },
  // CE extended display properties
  { key: "department_name", titleTranslationKey: "spreadsheet.columns.department_name" },
  { key: "project_name", titleTranslationKey: "spreadsheet.columns.project_name" },
  { key: "project_lead", titleTranslationKey: "spreadsheet.columns.project_lead" },
  { key: "bank_wide_project", titleTranslationKey: "spreadsheet.columns.bank_wide_project" },
  { key: "main_task_category", titleTranslationKey: "spreadsheet.columns.main_task_category" },
  { key: "sub_task_category", titleTranslationKey: "spreadsheet.columns.sub_task_category" },
  { key: "completed_date", titleTranslationKey: "spreadsheet.columns.completed_date" },
  { key: "reference_link", titleTranslationKey: "spreadsheet.columns.reference_link" },
  { key: "total_log_time", titleTranslationKey: "spreadsheet.columns.total_log_time" },
];

export const SPREADSHEET_PROPERTY_LIST: (keyof IIssueDisplayProperties)[] = [
  "department_name",
  "project_name",
  "main_task_category",
  "sub_task_category",
  "project_lead",
  "assignee",
  "modules",
  "bank_wide_project",
  "sub_issue_count",
  "priority",
  "cycle",
  "state",
  "progress_tracking",
  "start_date",
  "due_date",
  "completed_date",
  "reference_link",
  "total_log_time",
  // standard (non-default) columns below
  "labels",
  "estimate",
  "created_on",
  "updated_on",
  "link",
  "attachment_count",
];

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key in keyof IIssueDisplayProperties]: {
    i18n_title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
    icon: string;
    /** When false, the header renders as plain text without a sort dropdown */
    isSortable?: boolean;
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
    ascendingOrderTitle: "Low",
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
  // CE extended columns
  department_name: {
    i18n_title: "spreadsheet.columns.department_name",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "A",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Z",
    icon: "BuildingIcon",
    isSortable: false,
  },
  project_name: {
    i18n_title: "spreadsheet.columns.project_name",
    ascendingOrderKey: "project__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-project__name",
    descendingOrderTitle: "Z",
    icon: "FolderIcon",
  },
  project_lead: {
    i18n_title: "spreadsheet.columns.project_lead",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "A",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Z",
    icon: "MembersPropertyIcon",
    isSortable: false,
  },
  bank_wide_project: {
    i18n_title: "spreadsheet.columns.bank_wide_project",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "Yes",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "No",
    icon: "BankIcon",
    isSortable: false,
  },
  main_task_category: {
    i18n_title: "spreadsheet.columns.main_task_category",
    ascendingOrderKey: "main_task_category__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-main_task_category__name",
    descendingOrderTitle: "Z",
    icon: "TagIcon",
  },
  sub_task_category: {
    i18n_title: "spreadsheet.columns.sub_task_category",
    ascendingOrderKey: "sub_task_category__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-sub_task_category__name",
    descendingOrderTitle: "Z",
    icon: "TagIcon",
  },
  progress_tracking: {
    i18n_title: "spreadsheet.columns.progress_tracking",
    ascendingOrderKey: "-target_date",
    ascendingOrderTitle: "Newest",
    descendingOrderKey: "target_date",
    descendingOrderTitle: "Oldest",
    icon: "TrendingUpIcon",
  },
  completed_date: {
    i18n_title: "spreadsheet.columns.completed_date",
    ascendingOrderKey: "-completed_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "completed_at",
    descendingOrderTitle: "Old",
    icon: "CalendarDays",
  },
  reference_link: {
    i18n_title: "spreadsheet.columns.reference_link",
    ascendingOrderKey: "-link_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "link_count",
    descendingOrderTitle: "Least",
    icon: "Link2",
  },
  total_log_time: {
    i18n_title: "spreadsheet.columns.total_log_time",
    ascendingOrderKey: "-total_logged_minutes",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "total_logged_minutes",
    descendingOrderTitle: "Least",
    icon: "TimerIcon",
  },
  issue_type: {
    i18n_title: "common.issue_type",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "A",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Z",
    icon: "TagIcon",
  },
  key: {
    i18n_title: "issue.display.properties.id",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Old",
    icon: "HashIcon",
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
