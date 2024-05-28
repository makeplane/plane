// interfaces
import {
  TIssueLayout,
  TIssueLayoutViews,
  TIssueFilterKeys,
  TIssueFilterPriority,
  TIssueFilterPriorityObject,
  TIssueFilterState,
  TIssueFilterStateObject,
} from "types/issue";

// issue filters
export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: { [key in TIssueLayout]: Record<"filters", TIssueFilterKeys[]> } = {
  list: {
    filters: ["priority", "state", "labels"],
  },
  kanban: {
    filters: ["priority", "state", "labels"],
  },
  calendar: {
    filters: ["priority", "state", "labels"],
  },
  spreadsheet: {
    filters: ["priority", "state", "labels"],
  },
  gantt: {
    filters: ["priority", "state", "labels"],
  },
};

export const issueLayoutViews: Partial<TIssueLayoutViews> = {
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
export const issuePriorityFilters: TIssueFilterPriorityObject[] = [
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

export const issuePriorityFilter = (priorityKey: TIssueFilterPriority): TIssueFilterPriorityObject | undefined => {
  const currentIssuePriority: TIssueFilterPriorityObject | undefined =
    issuePriorityFilters && issuePriorityFilters.length > 0
      ? issuePriorityFilters.find((_priority) => _priority.key === priorityKey)
      : undefined;

  if (currentIssuePriority) return currentIssuePriority;
  return undefined;
};

// issue group filters
export const issueGroupColors: {
  [key in TIssueFilterState]: string;
} = {
  backlog: "#d9d9d9",
  unstarted: "#3f76ff",
  started: "#f59e0b",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export const issueGroups: TIssueFilterStateObject[] = [
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

export const issueGroupFilter = (issueKey: TIssueFilterState): TIssueFilterStateObject | undefined => {
  const currentIssueStateGroup: TIssueFilterStateObject | undefined =
    issueGroups && issueGroups.length > 0 ? issueGroups.find((group) => group.key === issueKey) : undefined;

  if (currentIssueStateGroup) return currentIssueStateGroup;
  return undefined;
};
