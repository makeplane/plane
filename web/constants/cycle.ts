import {
  GanttChartSquare,
  LayoutGrid,
  List,
  AlertOctagon,
  BarChart4,
  CircleDashed,
  Folder,
  Microscope,
  Search,
} from "lucide-react";

// types
import { TCycleLayoutOptions, TCycleTabOptions } from "@plane/types";

export const CYCLE_TABS_LIST: {
  key: TCycleTabOptions;
  name: string;
}[] = [
  {
    key: "active",
    name: "Active",
  },
  {
    key: "all",
    name: "All",
  },
];

export const CYCLE_VIEW_LAYOUTS: {
  key: TCycleLayoutOptions;
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
  title: string;
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    label: "day left",
    value: "current",
    title: "Active",
    color: "#F59E0B",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    label: "Yet to start",
    value: "upcoming",
    title: "Yet to start",
    color: "#3F76FF",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    label: "Completed",
    value: "completed",
    title: "Completed",
    color: "#16A34A",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    label: "Draft",
    value: "draft",
    title: "Draft",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
];

export const CYCLE_STATE_GROUPS_DETAILS = [
  {
    key: "completed_issues",
    title: "Completed",
    color: "#6490FE",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#FDD97F",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#FEB055",
  },
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#F0F0F3",
  },
];

export const WORKSPACE_ACTIVE_CYCLES_DETAILS = [
  {
    title: "10,000-feet view of all active cycles.",
    description:
      "Zoom out to see running cycles across all your projects at once instead of going from Cycle to Cycle in each project.",
    icon: Folder,
  },
  {
    title: "Get a snapshot of each active cycle.",
    description:
      "Track high-level metrics for all active cycles, see their state of progress, and get a sense of scope against deadlines.",
    icon: CircleDashed,
  },
  {
    title: "Compare burndowns.",
    description: "Monitor how each of your teams are performing with a peek into each cycle’s burndown report.",
    icon: BarChart4,
  },
  {
    title: "Quickly see make-or-break issues. ",
    description:
      "Preview high-priority issues for each cycle against due dates. See all of them per cycle in one click.",
    icon: AlertOctagon,
  },
  {
    title: "Zoom into cycles that need attention. ",
    description: "Investigate the state of any cycle that doesn’t conform to expectations in one click.",
    icon: Search,
  },
  {
    title: "Stay ahead of blockers.",
    description:
      "Spot challenges from one project to another and see inter-cycle dependencies that aren’t obvious from any other view.",
    icon: Microscope,
  },
];
