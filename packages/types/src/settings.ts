// local imports
import type { EUserWorkspaceRoles } from "./workspace";

export type TProfileSettingsTabs = "general" | "preferences" | "activity" | "notifications" | "security" | "api-tokens";

export type TWorkspaceSettingsTabs = "general" | "members" | "billing-and-plans" | "export" | "webhooks";

export type TWorkspaceSettingsItem = {
  key: TWorkspaceSettingsTabs;
  i18n_label: string;
  href: string;
  access: EUserWorkspaceRoles[];
  highlight: (pathname: string, baseUrl: string) => boolean;
};
