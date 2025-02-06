// icons
import {
  TProjectAppliedDisplayFilterKeys,
  TProjectOrderByOptions,
} from "@plane/types";

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
    i18n_label: "workspace_projects.network.private.title",
    description: "workspace_projects.network.private.description", //"Accessible only by invite",
    iconKey: "Lock",
  },
  {
    key: 2,
    labelKey: "Public",
    i18n_label: "workspace_projects.network.public.title",
    description: "workspace_projects.network.public.description", //"Anyone in the workspace except Guests can join",
    iconKey: "Globe2",
  },
];

export const GROUP_CHOICES = {
  backlog: {
    key: "backlog",
    i18n_label: "workspace_projects.state.backlog",
  },
  unstarted: {
    key: "unstarted",
    i18n_label: "workspace_projects.state.unstarted",
  },
  started: {
    key: "started",
    i18n_label: "workspace_projects.state.started",
  },
  completed: {
    key: "completed",
    i18n_label: "workspace_projects.state.completed",
  },
  cancelled: {
    key: "cancelled",
    i18n_label: "workspace_projects.state.cancelled",
  },
};

export const PROJECT_AUTOMATION_MONTHS = [
  { i18n_label: "common.months_count", value: 1 },
  { i18n_label: "common.months_count", value: 3 },
  { i18n_label: "common.months_count", value: 6 },
  { i18n_label: "common.months_count", value: 9 },
  { i18n_label: "common.months_count", value: 12 },
];

export const PROJECT_UNSPLASH_COVERS = [
  "https://images.unsplash.com/photo-1531045535792-b515d59c3d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1693027407934-e3aa8a54c7ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1464925257126-6450e871c667?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1606768666853-403c90a981ad?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1627556592933-ffe99c1cd9eb?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1643330683233-ff2ac89b002c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1475738972911-5b44ce984c42?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1673393058808-50e9baaf4d2c?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1696643830146-44a8755f1905?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1693868769698-6c7440636a09?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1691230995681-480d86cbc135?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1675351066828-6fc770b90dd2?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
];

export const PROJECT_ORDER_BY_OPTIONS: {
  key: TProjectOrderByOptions;
  i18n_label: string;
}[] = [
  {
    key: "sort_order",
    i18n_label: "workspace_projects.sort.manual",
  },
  {
    key: "name",
    i18n_label: "workspace_projects.sort.name",
  },
  {
    key: "created_at",
    i18n_label: "workspace_projects.sort.created_at",
  },
  {
    key: "members_length",
    i18n_label: "workspace_projects.sort.members_length",
  },
];

export const PROJECT_DISPLAY_FILTER_OPTIONS: {
  key: TProjectAppliedDisplayFilterKeys;
  i18n_label: string;
}[] = [
  {
    key: "my_projects",
    i18n_label: "workspace_projects.scope.my_projects",
  },
  {
    key: "archived_projects",
    i18n_label: "workspace_projects.scope.archived_projects",
  },
];

export const PROJECT_ERROR_MESSAGES = {
  permissionError: {
    i18n_title: "workspace_projects.error.permission",
    i18n_message: undefined,
  },
  cycleDeleteError: {
    i18n_title: "error",
    i18n_message: "workspace_projects.error.cycle_delete",
  },
  moduleDeleteError: {
    i18n_title: "error",
    i18n_message: "workspace_projects.error.module_delete",
  },
  issueDeleteError: {
    i18n_title: "error",
    i18n_message: "workspace_projects.error.issue_delete",
  },
};
