export const GROUP_BY_OPTIONS: Array<{
  name: string;
  key: "state" | "priority" | "labels" | null;
}> = [
  { name: "State", key: "state" },
  { name: "Priority", key: "priority" },
  { name: "Labels", key: "labels" },
  { name: "None", key: null },
];

export const ORDER_BY_OPTIONS: Array<{
  name: string;
  key: "created_at" | "updated_at" | "priority" | "sort_order";
}> = [
  { name: "Manual", key: "sort_order" },
  { name: "Last created", key: "created_at" },
  { name: "Last updated", key: "updated_at" },
  { name: "Priority", key: "priority" },
];

export const FILTER_ISSUE_OPTIONS: Array<{
  name: string;
  key: "active" | "backlog" | null;
}> = [
  {
    name: "All",
    key: null,
  },
  {
    name: "Active Issues",
    key: "active",
  },
  {
    name: "Backlog Issues",
    key: "backlog",
  },
];
