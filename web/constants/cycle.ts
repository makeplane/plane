import { GanttChartSquare, LayoutGrid, List } from "lucide-react";
// types
import { TCycleLayout, TCycleView } from "@plane/types";

export const CYCLE_TAB_LIST: {
  key: TCycleView;
  name: string;
}[] = [
  {
    key: "all",
    name: "All",
  },
  {
    key: "active",
    name: "Active",
  },
  {
    key: "upcoming",
    name: "Upcoming",
  },
  {
    key: "completed",
    name: "Completed",
  },
  {
    key: "draft",
    name: "Drafts",
  },
];

export const CYCLE_VIEW_LAYOUTS: {
  key: TCycleLayout;
  icon: any;
  title: string;
}[] = [
  {
    key: "list",
    icon: List,
    title: "List layout",
  },
  {
    key: "board",
    icon: LayoutGrid,
    title: "Grid layout",
  },
  {
    key: "gantt",
    icon: GanttChartSquare,
    title: "Gantt layout",
  },
];

export const CYCLE_STATUS: {
  label: string;
  value: "current" | "upcoming" | "completed" | "draft";
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    label: "day left",
    value: "current",
    color: "#F59E0B",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    label: "Yet to start",
    value: "upcoming",
    color: "#3F76FF",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    label: "Completed",
    value: "completed",
    color: "#16A34A",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    label: "Draft",
    value: "draft",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
];
