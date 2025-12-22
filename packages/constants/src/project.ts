// plane imports
import type { TProjectAppliedDisplayFilterKeys, TProjectOrderByOptions } from "@plane/types";
// local imports

export type TNetworkChoiceIconKey = "Lock" | "Globe2";

export type TNetworkChoice = {
  key: 0 | 2;
  labelKey: string;
  i18n_label: string;
  description: string;
  iconKey: TNetworkChoiceIconKey;
};

export const NETWORK_CHOICES: TNetworkChoice[] = [
  {
    key: 0,
    labelKey: "Private",
    i18n_label: "workspace_projects.network.private.title" as const,
    description: "workspace_projects.network.private.description", //"Accessible only by invite",
    iconKey: "Lock",
  },
  {
    key: 2,
    labelKey: "Public",
    i18n_label: "workspace_projects.network.public.title" as const,
    description: "workspace_projects.network.public.description", //"Anyone in the workspace except Guests can join",
    iconKey: "Globe2",
  },
];

export const GROUP_CHOICES = {
  backlog: {
    key: "backlog",
    i18n_label: "workspace_projects.state.backlog" as const,
  },
  unstarted: {
    key: "unstarted",
    i18n_label: "workspace_projects.state.unstarted" as const,
  },
  started: {
    key: "started",
    i18n_label: "workspace_projects.state.started" as const,
  },
  completed: {
    key: "completed",
    i18n_label: "workspace_projects.state.completed" as const,
  },
  cancelled: {
    key: "cancelled",
    i18n_label: "workspace_projects.state.cancelled" as const,
  },
};

export const PROJECT_AUTOMATION_MONTHS = [
  { i18n_label: "workspace_projects.common.months_count" as const, value: 1 },
  { i18n_label: "workspace_projects.common.months_count" as const, value: 3 },
  { i18n_label: "workspace_projects.common.months_count" as const, value: 6 },
  { i18n_label: "workspace_projects.common.months_count" as const, value: 9 },
  { i18n_label: "workspace_projects.common.months_count" as const, value: 12 },
];

export const PROJECT_ORDER_BY_OPTIONS = [
  {
    key: "sort_order",
    i18n_label: "workspace_projects.sort.manual" as const,
  },
  {
    key: "name",
    i18n_label: "workspace_projects.sort.name" as const,
  },
  {
    key: "created_at",
    i18n_label: "workspace_projects.sort.created_at" as const,
  },
  {
    key: "members_length",
    i18n_label: "workspace_projects.sort.members_length" as const,
  },
] as const;

export const PROJECT_DISPLAY_FILTER_OPTIONS = [
  {
    key: "my_projects",
    i18n_label: "workspace_projects.scope.my_projects" as const,
  },
  {
    key: "archived_projects",
    i18n_label: "workspace_projects.scope.archived_projects" as const,
  },
] as const;

export const PROJECT_ERROR_MESSAGES = {
  permissionError: {
    i18n_title: "workspace_projects.error.permission" as const,
    i18n_message: undefined,
  },
  cycleDeleteError: {
    i18n_title: "error" as const,
    i18n_message: "workspace_projects.error.cycle_delete" as const,
  },
  moduleDeleteError: {
    i18n_title: "error" as const,
    i18n_message: "workspace_projects.error.module_delete" as const,
  },
  issueDeleteError: {
    i18n_title: "error" as const,
    i18n_message: "workspace_projects.error.issue_delete" as const,
  },
};

export enum EProjectFeatureKey {
  WORK_ITEMS = "work_items",
  CYCLES = "cycles",
  MODULES = "modules",
  VIEWS = "views",
  PAGES = "pages",
  INTAKE = "intake",
}
