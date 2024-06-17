import { Kanban, List } from "lucide-react";
// types
import { TIssuePriorities } from "@plane/types";
import { TIssueLayout, TIssueFilterKeys, TIssueFilterPriorityObject } from "@/types/issue";

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

export const ISSUE_LAYOUTS: {
  key: TIssueLayout;
  title: string;
  icon: any;
}[] = [
  { key: "list", title: "List", icon: List },
  { key: "kanban", title: "Kanban", icon: Kanban },
  // { key: "calendar", title: "Calendar", icon: Calendar },
  // { key: "spreadsheet", title: "Spreadsheet", icon: Sheet },
  // { key: "gantt", title: "Gantt chart", icon: GanttChartSquare },
];

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

export const issuePriorityFilter = (priorityKey: TIssuePriorities): TIssueFilterPriorityObject | undefined => {
  const currentIssuePriority: TIssueFilterPriorityObject | undefined =
    issuePriorityFilters && issuePriorityFilters.length > 0
      ? issuePriorityFilters.find((_priority) => _priority.key === priorityKey)
      : undefined;

  if (currentIssuePriority) return currentIssuePriority;
  return undefined;
};
