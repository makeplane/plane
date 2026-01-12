// local imports
import type { EUserPermissions } from "./enums";
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

export type TProjectSettingsTabs =
  | "general"
  | "members"
  | "features"
  | "states"
  | "labels"
  | "estimates"
  | "automations";

export type TProjectSettingsItem = {
  key: TProjectSettingsTabs;
  i18n_label: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string) => boolean;
};
