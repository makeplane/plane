// types
import {
  TModuleLayoutOptions,
  TModuleOrderByOptions,
  TModuleStatus,
} from "@plane/types";

export const MODULE_STATUS: {
  i18n_label: string;
  value: TModuleStatus;
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    i18n_label: "project_modules.status.backlog",
    value: "backlog",
    color: "#a3a3a2",
    textColor: "text-custom-text-400",
    bgColor: "bg-custom-background-80",
  },
  {
    i18n_label: "project_modules.status.planned",
    value: "planned",
    color: "#3f76ff",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    i18n_label: "project_modules.status.in_progress",
    value: "in-progress",
    color: "#f39e1f",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    i18n_label: "project_modules.status.paused",
    value: "paused",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
  {
    i18n_label: "project_modules.status.completed",
    value: "completed",
    color: "#16a34a",
    textColor: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    i18n_label: "project_modules.status.cancelled",
    value: "cancelled",
    color: "#ef4444",
    textColor: "text-red-500",
    bgColor: "bg-red-50",
  },
];

export const MODULE_VIEW_LAYOUTS: {
  key: TModuleLayoutOptions;
  i18n_title: string;
}[] = [
  {
    key: "list",
    i18n_title: "project_modules.layout.list",
  },
  {
    key: "board",
    i18n_title: "project_modules.layout.board",
  },
  {
    key: "gantt",
    i18n_title: "project_modules.layout.timeline",
  },
];

export const MODULE_ORDER_BY_OPTIONS: {
  key: TModuleOrderByOptions;
  i18n_label: string;
}[] = [
  {
    key: "name",
    i18n_label: "project_modules.order_by.name",
  },
  {
    key: "progress",
    i18n_label: "project_modules.order_by.progress",
  },
  {
    key: "issues_length",
    i18n_label: "project_modules.order_by.issues",
  },
  {
    key: "target_date",
    i18n_label: "project_modules.order_by.due_date",
  },
  {
    key: "created_at",
    i18n_label: "project_modules.order_by.created_at",
  },
  {
    key: "sort_order",
    i18n_label: "project_modules.order_by.manual",
  },
];
