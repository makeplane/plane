import { TStateGroups } from "@plane/types";

export type TDraggableData = {
  groupKey: TStateGroups;
  id: string;
};

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

export const ARCHIVABLE_STATE_GROUPS = [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key];
export const COMPLETED_STATE_GROUPS = [STATE_GROUPS.completed.key];
export const PENDING_STATE_GROUPS = [
  STATE_GROUPS.backlog.key,
  STATE_GROUPS.unstarted.key,
  STATE_GROUPS.started.key,
  STATE_GROUPS.cancelled.key,
];

export const DISPLAY_WORKFLOW_PRO_CTA = false;
