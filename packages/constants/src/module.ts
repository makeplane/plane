import { GanttChartSquare, LayoutGrid, List } from "lucide-react";
// types
import {
  TModuleLayoutOptions,
  TModuleOrderByOptions,
  TModuleStatus,
} from "@plane/types";

export const MODULE_STATUS: {
  label: string;
  value: TModuleStatus;
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    label: "project_modules.status.backlog",
    value: "backlog",
    color: "#a3a3a2",
    textColor: "text-custom-text-400",
    bgColor: "bg-custom-background-80",
  },
  {
    label: "project_modules.status.planned",
    value: "planned",
    color: "#3f76ff",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    label: "project_modules.status.in_progress",
    value: "in-progress",
    color: "#f39e1f",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    label: "project_modules.status.paused",
    value: "paused",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
  {
    label: "project_modules.status.completed",
    value: "completed",
    color: "#16a34a",
    textColor: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    label: "project_modules.status.cancelled",
    value: "cancelled",
    color: "#ef4444",
    textColor: "text-red-500",
    bgColor: "bg-red-50",
  },
];

export const MODULE_VIEW_LAYOUTS: {
  key: TModuleLayoutOptions;
  icon: any;
  title: string;
}[] = [
  {
    key: "list",
    icon: List,
    title: "project_modules.layout.list",
  },
  {
    key: "board",
    icon: LayoutGrid,
    title: "project_modules.layout.board",
  },
  {
    key: "gantt",
    icon: GanttChartSquare,
    title: "project_modules.layout.timeline",
  },
];

export const MODULE_ORDER_BY_OPTIONS: {
  key: TModuleOrderByOptions;
  label: string;
}[] = [
  {
    key: "name",
    label: "project_modules.order_by.name",
  },
  {
    key: "progress",
    label: "project_modules.order_by.progress",
  },
  {
    key: "issues_length",
    label: "project_modules.order_by.issues",
  },
  {
    key: "target_date",
    label: "project_modules.order_by.due_date",
  },
  {
    key: "created_at",
    label: "project_modules.order_by.created_at",
  },
  {
    key: "sort_order",
    label: "project_modules.order_by.manual",
  },
];
