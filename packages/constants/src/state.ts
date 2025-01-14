export type TStateGroups =
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "cancelled";

export const STATE_GROUPS: {
  [key in TStateGroups]: {
    key: TStateGroups;
    label: string;
    color: string;
  };
} = {
  backlog: {
    key: "backlog",
    label: "Backlog",
    color: "#d9d9d9",
  },
  unstarted: {
    key: "unstarted",
    label: "Unstarted",
    color: "#3f76ff",
  },
  started: {
    key: "started",
    label: "Started",
    color: "#f59e0b",
  },
  completed: {
    key: "completed",
    label: "Completed",
    color: "#16a34a",
  },
  cancelled: {
    key: "cancelled",
    label: "Canceled",
    color: "#dc2626",
  },
};

export const ARCHIVABLE_STATE_GROUPS = [
  STATE_GROUPS.completed.key,
  STATE_GROUPS.cancelled.key,
];

export const PROGRESS_STATE_GROUPS_DETAILS = [
  {
    key: "completed_issues",
    title: "Completed",
    color: "#16A34A",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#F59E0B",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#3A3A3A",
  },
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#A3A3A3",
  },
];
