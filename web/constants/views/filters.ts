import { TIssuePriorities, TStateGroups } from "@plane/types";

// filters constants
export const STATE_GROUP_PROPERTY: Record<TStateGroups, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#d9d9d9" },
  unstarted: { label: "Unstarted", color: "#3f76ff" },
  started: { label: "Started", color: "#f59e0b" },
  completed: { label: "Completed", color: "#16a34a" },
  cancelled: { label: "Canceled", color: "#dc2626" },
};

export const PRIORITIES_PROPERTY: Record<TIssuePriorities, { label: string }> = {
  urgent: { label: "Urgent" },
  high: { label: "High" },
  medium: { label: "Medium" },
  low: { label: "Low" },
  none: { label: "None" },
};

export const DATE_PROPERTY: Record<string, { label: string }> = {
  "1_weeks;after;fromnow": { label: "1 week from now" },
  "2_weeks;after;fromnow": { label: "2 weeks from now" },
  "1_months;after;fromnow": { label: "1 month from now" },
  "2_months;after;fromnow": { label: "2 months from now" },
  custom: { label: "Custom" },
};
