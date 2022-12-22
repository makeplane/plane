import type { IIssue, NestedKeyOf } from "types";

export const PRIORITIES = ["urgent", "high", "medium", "low"];

export const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

export const NETWORK_CHOICES = { "0": "Secret", "2": "Public" };

export const GROUP_CHOICES = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const MODULE_STATUS = [
  { label: "Backlog", value: "backlog" },
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in-progress" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  // { name: "Cycle", key: "issue_cycle.cycle_detail.name" },
  { name: "Created By", key: "created_by" },
  { name: "None", key: null },
];

export const orderByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "Last created", key: "created_at" },
  { name: "Last updated", key: "updated_at" },
  { name: "Priority", key: "priority" },
  { name: "None", key: null },
];

export const filterIssueOptions: Array<{
  name: string;
  key: "activeIssue" | "backlogIssue" | null;
}> = [
  {
    name: "All",
    key: null,
  },
  {
    name: "Active Issues",
    key: "activeIssue",
  },
  {
    name: "Backlog Issues",
    key: "backlogIssue",
  },
];
