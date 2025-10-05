import { TPowerKCommandGroup } from "../../core/types";

export const POWER_K_GROUP_PRIORITY: Record<TPowerKCommandGroup, number> = {
  contextual: 1,
  create: 2,
  navigation: 3,
  general: 7,
  settings: 8,
  account: 9,
  help: 10,
};

export const POWER_K_GROUP_TITLES: Record<TPowerKCommandGroup, string> = {
  contextual: "Contextual",
  navigation: "Navigate",
  create: "Create",
  general: "General",
  settings: "Settings",
  help: "Help",
  account: "Account",
};
