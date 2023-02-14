// types
import { IIssue, NestedKeyOf } from "types";

export const GROUP_BY_OPTIONS: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  { name: "Created By", key: "created_by" },
  { name: "Assignee", key: "assignees" },
  { name: "None", key: null },
];

export const ORDER_BY_OPTIONS: Array<{ name: string; key: NestedKeyOf<IIssue> | "manual" | null }> =
  [
    // { name: "Manual", key: "manual" },
    { name: "Last created", key: "created_at" },
    { name: "Last updated", key: "updated_at" },
    { name: "Priority", key: "priority" },
    // { name: "None", key: null },
  ];

export const FILTER_ISSUE_OPTIONS: Array<{
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
