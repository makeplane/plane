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

export const CYCLE_STATE_GROUPS_DETAILS = [
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#F0F0F3",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#FB923C",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#FFC53D",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#d687ff",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#ef4444",
  },
];

export const CYCLE_EMPTY_STATE_DETAILS = {
  active: {
    key: "active",
    title: "No active cycles",
    description:
      "An active cycle includes any period that encompasses today's date within its range. Find the progress and details of the active cycle here.",
  },
  upcoming: {
    key: "upcoming",
    title: "No upcoming cycles",
    description: "Upcoming cycles on deck! Just add dates to cycles in draft, and they'll show up right here.",
  },
  completed: {
    key: "completed",
    title: "No completed cycles",
    description: "Any cycle with a past due date is considered completed. Explore all completed cycles here.",
  },
  draft: {
    key: "draft",
    title: "No draft cycles",
    description: "No dates added in cycles? Find them here as drafts.",
  },
};
