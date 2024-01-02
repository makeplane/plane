import { TStateGroups } from "@plane/types";

export const STATE_GROUP_COLORS: {
  [key in TStateGroups]: string;
} = {
  backlog: "#d9d9d9",
  unstarted: "#3f76ff",
  started: "#f59e0b",
  completed: "#16a34a",
  cancelled: "#dc2626",
};
