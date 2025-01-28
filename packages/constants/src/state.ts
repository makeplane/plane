export type TStateGroups =
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "cancelled";

export type TDraggableData = {
  groupKey: TStateGroups;
  id: string;
};

export const STATE_GROUPS: {
  [key in TStateGroups]: {
    key: TStateGroups;
    i18n_label: string;
    color: string;
  };
} = {
  backlog: {
    key: "backlog",
    i18n_label: "state_group.backlog",
    color: "#d9d9d9",
  },
  unstarted: {
    key: "unstarted",
    i18n_label: "state_group.unstarted",
    color: "#3f76ff",
  },
  started: {
    key: "started",
    i18n_label: "state_group.started",
    color: "#f59e0b",
  },
  completed: {
    key: "completed",
    i18n_label: "state_group.completed",
    color: "#16a34a",
  },
  cancelled: {
    key: "cancelled",
    i18n_label: "state_group.cancelled",
    color: "#dc2626",
  },
};

export const ARCHIVABLE_STATE_GROUPS = [
  STATE_GROUPS.completed.key,
  STATE_GROUPS.cancelled.key,
];
export const COMPLETED_STATE_GROUPS = [STATE_GROUPS.completed.key];
export const PENDING_STATE_GROUPS = [
  STATE_GROUPS.backlog.key,
  STATE_GROUPS.unstarted.key,
  STATE_GROUPS.started.key,
  STATE_GROUPS.cancelled.key,
];

export const DISPLAY_WORKFLOW_PRO_CTA = false;

export const PROGRESS_STATE_GROUPS_DETAILS = [
  {
    key: "completed_issues",
    i18n_title: "state_group.completed",
    color: "#16A34A",
  },
  {
    key: "started_issues",
    i18n_title: "state_group.started",
    color: "#F59E0B",
  },
  {
    key: "unstarted_issues",
    i18n_title: "state_group.unstarted",
    color: "#3A3A3A",
  },
  {
    key: "backlog_issues",
    i18n_title: "state_group.backlog",
    color: "#A3A3A3",
  },
];
