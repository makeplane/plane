// interfaces
import {
  IIssueBoardViews,
  // priority
  TIssuePriorityKey,
  // state groups
  TIssueGroupKey,
  IIssuePriorityFilters,
  IIssueGroup,
} from "store/types/issue";
// icons
import {
  BacklogStateIcon,
  UnstartedStateIcon,
  StartedStateIcon,
  CompletedStateIcon,
  CancelledStateIcon,
} from "components/icons";

// all issue views
export const issueViews: IIssueBoardViews[] = [
  {
    key: "list",
    title: "List View",
    icon: "format_list_bulleted",
    className: "",
  },
  {
    key: "kanban",
    title: "Board View",
    icon: "grid_view",
    className: "",
  },
  // {
  //   key: "calendar",
  //   title: "Calendar View",
  //   icon: "calendar_month",
  //   className: "",
  // },
  // {
  //   key: "spreadsheet",
  //   title: "Spreadsheet View",
  //   icon: "table_chart",
  //   className: "",
  // },
  // {
  //   key: "gantt",
  //   title: "Gantt Chart View",
  //   icon: "waterfall_chart",
  //   className: "rotate-90",
  // },
];

// issue priority filters
export const issuePriorityFilters: IIssuePriorityFilters[] = [
  {
    key: "urgent",
    title: "Urgent",
    className: "border border-red-500/50 bg-red-500/20 text-red-500",
    icon: "error",
  },
  {
    key: "high",
    title: "High",
    className: "border border-orange-500/50 bg-orange-500/20 text-orange-500",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    title: "Medium",
    className: "border border-yellow-500/50 bg-yellow-500/20 text-yellow-500",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    title: "Low",
    className: "border border-green-500/50 bg-green-500/20 text-green-500",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    title: "None",
    className: "border border-gray-500/50 bg-gray-500/20 text-gray-500",
    icon: "block",
  },
];

export const issuePriorityFilter = (priorityKey: TIssuePriorityKey): IIssuePriorityFilters | null => {
  const currentIssuePriority: IIssuePriorityFilters | undefined | null =
    issuePriorityFilters && issuePriorityFilters.length > 0
      ? issuePriorityFilters.find((_priority) => _priority.key === priorityKey)
      : null;

  if (currentIssuePriority === undefined || currentIssuePriority === null) return null;
  return { ...currentIssuePriority };
};

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

export const issueGroups: IIssueGroup[] = [
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
    color: "#3f76ff",
    className: `border-[#3f76ff]/50 text-[#3f76ff] bg-[#3f76ff]/10`,
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

export const issueGroupFilter = (issueKey: TIssueGroupKey): IIssueGroup | null => {
  const currentIssueStateGroup: IIssueGroup | undefined | null =
    issueGroups && issueGroups.length > 0 ? issueGroups.find((group) => group.key === issueKey) : null;

  if (currentIssueStateGroup === undefined || currentIssueStateGroup === null) return null;
  return { ...currentIssueStateGroup };
};
