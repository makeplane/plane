import type { TPowerKCommandGroup } from "../../core/types";

export const POWER_K_GROUP_PRIORITY: Record<TPowerKCommandGroup, number> = {
  contextual: 1,
  create: 2,
  navigation: 3,
  general: 7,
  settings: 8,
  account: 9,
  miscellaneous: 10,
  preferences: 11,
  help: 12,
};

export const POWER_K_GROUP_I18N_TITLES: Record<TPowerKCommandGroup, string> = {
  contextual: "power_k.group_titles.contextual",
  navigation: "power_k.group_titles.navigation",
  create: "power_k.group_titles.create",
  general: "power_k.group_titles.general",
  settings: "power_k.group_titles.settings",
  help: "power_k.group_titles.help",
  account: "power_k.group_titles.account",
  miscellaneous: "power_k.group_titles.miscellaneous",
  preferences: "power_k.group_titles.preferences",
};
