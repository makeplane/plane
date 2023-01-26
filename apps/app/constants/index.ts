import type { IIssue, NestedKeyOf } from "types";

export const PRIORITIES = ["urgent", "high", "medium", "low", null];

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
  { label: "Backlog", value: "backlog", color: "#5e6ad2" },
  { label: "Planned", value: "planned", color: "#26b5ce" },
  { label: "In Progress", value: "in-progress", color: "#f2c94c" },
  { label: "Paused", value: "paused", color: "#ff6900" },
  { label: "Completed", value: "completed", color: "#4cb782" },
  { label: "Cancelled", value: "cancelled", color: "#cc1d10" },
];

export const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
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

export const companySize = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
];
