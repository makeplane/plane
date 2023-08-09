// interfaces
import { TIssueRenderViews, TIssueGroupKey, TIssuePriorityFilters, TIssueGroup } from "interfaces/issues";
// icons
import {
  BacklogStateIcon,
  UnstartedStateIcon,
  StartedStateIcon,
  CompletedStateIcon,
  CancelledStateIcon,
} from "components/icons";

// all issue views
export const issueViews: TIssueRenderViews[] = [
  {
    key: "list",
    title: "List View",
    icon: "format_list_bulleted",
    className: "",
  },
  {
    key: "board",
    title: "Board View",
    icon: "grid_view",
    className: "",
  },
  {
    key: "calendar",
    title: "Calendar View",
    icon: "calendar_month",
    className: "",
  },
  {
    key: "spreadsheet",
    title: "Spreadsheet View",
    icon: "table_chart",
    className: "",
  },
  {
    key: "gantt",
    title: "Gantt Chart View",
    icon: "waterfall_chart",
    className: "rotate-90",
  },
];

// issue priority filters
export const issuePriorityFilters: TIssuePriorityFilters[] = [
  {
    key: "urgent",
    title: "Urgent",
    color: "bg-red-500/20 text-red-500",
    icon: "error",
  },
  {
    key: "high",
    title: "High",
    color: "bg-red-500/20 text-red-500",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    title: "Medium",
    color: "bg-red-500/20 text-red-500",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    title: "Low",
    color: "bg-red-500/20 text-red-500",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    title: "None",
    color: "bg-red-500/20 text-red-500",
    icon: "block",
  },
];

// issue group filters

export const issueGroupColors: {
  [key: string]: string;
} = {
  backlog: "#d9d9d9",
  unstarted: "#3f76ff",
  started: "#f59e0b",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export const issueGroups: TIssueGroup[] = [
  {
    key: "backlog",
    title: "Backlog",
    color: "#d9d9d9",
    className: `border-[#d9d9d9]/50 text-[#d9d9d9] bg-[#d9d9d9]/10`,
    icon: BacklogStateIcon,
  },
  {
    key: "unstarted",
    title: "Unstarted",
    color: issueGroupColors["unstarted"],
    className: `border-[${issueGroupColors["unstarted"]}]/50 text-[${issueGroupColors["unstarted"]}] bg-[${issueGroupColors["unstarted"]}]/10`,
    icon: UnstartedStateIcon,
  },
  {
    key: "started",
    title: "Started",
    color: "#f59e0b",
    className: `border-[#f59e0b]/50 text-[#f59e0b] bg-[#f59e0b]/10`,
    icon: StartedStateIcon,
  },
  {
    key: "completed",
    title: "Completed",
    color: "#16a34a",
    className: `border-[#16a34a]/50 text-[#16a34a] bg-[#16a34a]/10`,
    icon: CompletedStateIcon,
  },
  {
    key: "cancelled",
    title: "Cancelled",
    color: "#dc2626",
    className: `border-[#dc2626]/50 text-[#dc2626] bg-[#dc2626]/10`,
    icon: CancelledStateIcon,
  },
];

export const issueGroupFilter = (issueKey: TIssueGroupKey): TIssueGroup | null => {
  const currentIssueStateGroup: TIssueGroup | undefined | null =
    issueGroups && issueGroups.length > 0 ? issueGroups.find((group) => group.key === issueKey) : null;

  if (currentIssueStateGroup === undefined || currentIssueStateGroup === null) return null;
  return { ...currentIssueStateGroup };
};
