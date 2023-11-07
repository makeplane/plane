// interfaces
import {
  // priority
  TIssuePriorityKey,
  // state groups
  TIssueGroupKey,
  IIssuePriorityFilters,
  IIssueGroup,
} from "types/issue";

// all issue views
export const issueViews: any = {
  list: {
    title: "List View",
    icon: "format_list_bulleted",
    className: "",
  },
  kanban: {
    title: "Board View",
    icon: "grid_view",
    className: "",
  },
};

// issue priority filters
export const issuePriorityFilters: IIssuePriorityFilters[] = [
  {
    key: "urgent",
    title: "Urgent",
    className: "bg-red-500 border-red-500 text-white",
    icon: "error",
  },
  {
    key: "high",
    title: "High",
    className: "text-orange-500 border-custom-border-300",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    title: "Medium",
    className: "text-yellow-500 border-custom-border-300",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    title: "Low",
    className: "text-green-500 border-custom-border-300",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    title: "None",
    className: "text-gray-500 border-custom-border-300",
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
    className: `text-[#d9d9d9] bg-[#d9d9d9]/10`,
  },
  {
    key: "unstarted",
    title: "Unstarted",
    color: "#3f76ff",
    className: `text-[#3f76ff] bg-[#3f76ff]/10`,
  },
  {
    key: "started",
    title: "Started",
    color: "#f59e0b",
    className: `text-[#f59e0b] bg-[#f59e0b]/10`,
  },
  {
    key: "completed",
    title: "Completed",
    color: "#16a34a",
    className: `text-[#16a34a] bg-[#16a34a]/10`,
  },
  {
    key: "cancelled",
    title: "Cancelled",
    color: "#dc2626",
    className: `text-[#dc2626] bg-[#dc2626]/10`,
  },
];

export const issueGroupFilter = (issueKey: TIssueGroupKey): IIssueGroup | null => {
  const currentIssueStateGroup: IIssueGroup | undefined | null =
    issueGroups && issueGroups.length > 0 ? issueGroups.find((group) => group.key === issueKey) : null;

  if (currentIssueStateGroup === undefined || currentIssueStateGroup === null) return null;
  return { ...currentIssueStateGroup };
};
