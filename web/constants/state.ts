import { localized } from "helpers/localization.helper";
import { TStateGroups } from "types";

export const STATE_GROUP = ["Backlog", "Unstarted", "Started", "Completed", "Cancelled"];

export const STATE_GROUP_LABEL: {
  [key: string]: string;
} = {
  backlog: localized("Backlog"),
  unstarted: localized("Unstarted"),
  started: localized("Started"),
  completed: localized("Completed"),
  cancelled: localized("Cancelled"),
  none: localized("None"),
};

export const STATE_GROUP_COLORS: {
  [key in TStateGroups]: string;
} = {
  backlog: "#d9d9d9",
  unstarted: "#3f76ff",
  started: "#f59e0b",
  completed: "#16a34a",
  cancelled: "#dc2626",
};
