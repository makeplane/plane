import { store } from "@/lib/store-context";

/**
 * @description Get the i18n key for the project settings page label
 * @param settingsKey - The key of the project settings page
 * @param defaultLabelKey - The default i18n key for the project settings page label
 * @returns The i18n key for the project settings page label
 */
export const getProjectSettingsPageLabelI18nKey = (settingsKey: string, defaultLabelKey: string) => {
  if (settingsKey === "members" && store.teamspaceRoot.teamspaces.isTeamspacesFeatureEnabled) {
    return "common.members_and_teamspaces";
  }
  return defaultLabelKey;
};
