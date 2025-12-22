// types
import type { TModuleLayoutOptions, TModuleOrderByOptions, TModuleStatus } from "@plane/types";

export const MODULE_STATUS_COLORS: {
  [key in TModuleStatus]: string;
} = {
  backlog: "#a3a3a2",
  planned: "#3f76ff",
  paused: "#525252",
  completed: "#16a34a",
  cancelled: "#ef4444",
  "in-progress": "#f39e1f",
};

export const MODULE_STATUS = [
  {
    i18n_label: "project_modules.status.backlog" as const,
    value: "backlog" as const,
    color: MODULE_STATUS_COLORS.backlog,
    textColor: "text-placeholder",
    bgColor: "bg-layer-1",
  },
  {
    i18n_label: "project_modules.status.planned" as const,
    value: "planned" as const,
    color: MODULE_STATUS_COLORS.planned,
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    i18n_label: "project_modules.status.in_progress" as const,
    value: "in-progress" as const,
    color: MODULE_STATUS_COLORS["in-progress"],
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    i18n_label: "project_modules.status.paused" as const,
    value: "paused" as const,
    color: MODULE_STATUS_COLORS.paused,
    textColor: "text-tertiary",
    bgColor: "bg-surface-2",
  },
  {
    i18n_label: "project_modules.status.completed" as const,
    value: "completed" as const,
    color: MODULE_STATUS_COLORS.completed,
    textColor: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    i18n_label: "project_modules.status.cancelled" as const,
    value: "cancelled" as const,
    color: MODULE_STATUS_COLORS.cancelled,
    textColor: "text-red-500",
    bgColor: "bg-red-50",
  },
];

export const MODULE_VIEW_LAYOUTS = [
  {
    key: "list",
    i18n_title: "project_modules.layout.list" as const,
  },
  {
    key: "board",
    i18n_title: "project_modules.layout.board" as const,
  },
  {
    key: "gantt",
    i18n_title: "project_modules.layout.timeline" as const,
  },
] as const;

export const MODULE_ORDER_BY_OPTIONS = [
  {
    key: "name",
    i18n_label: "project_modules.order_by.name" as const,
  },
  {
    key: "progress",
    i18n_label: "project_modules.order_by.progress" as const,
  },
  {
    key: "issues_length",
    i18n_label: "project_modules.order_by.issues" as const,
  },
  {
    key: "target_date",
    i18n_label: "project_modules.order_by.due_date" as const,
  },
  {
    key: "created_at",
    i18n_label: "project_modules.order_by.created_at" as const,
  },
  {
    key: "sort_order",
    i18n_label: "project_modules.order_by.manual" as const,
  },
] as const;
