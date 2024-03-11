import { GanttChartSquare, LayoutGrid, List } from "lucide-react";
// types
import { TModuleStatus } from "@plane/types";

export const MODULE_STATUS: {
  label: string;
  value: TModuleStatus;
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    label: "Backlog",
    value: "backlog",
    color: "#a3a3a2",
    textColor: "text-custom-text-400",
    bgColor: "bg-custom-background-80",
  },
  {
    label: "Planned",
    value: "planned",
    color: "#3f76ff",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    label: "In Progress",
    value: "in-progress",
    color: "#f39e1f",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    label: "Paused",
    value: "paused",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
  {
    label: "Completed",
    value: "completed",
    color: "#16a34a",
    textColor: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    label: "Cancelled",
    value: "cancelled",
    color: "#ef4444",
    textColor: "text-red-500",
    bgColor: "bg-red-50",
  },
];

export const MODULE_VIEW_LAYOUTS: { key: "list" | "grid" | "gantt_chart"; icon: any; title: string }[] = [
  {
    key: "list",
    icon: List,
    title: "List layout",
  },
  {
    key: "grid",
    icon: LayoutGrid,
    title: "Grid layout",
  },
  {
    key: "gantt_chart",
    icon: GanttChartSquare,
    title: "Gantt layout",
  },
];
