// plane imports
import { EUserPermissions } from "@plane/types";
import type { TProjectSettingsItem, TProjectSettingsTabs } from "@plane/types";

export enum PROJECT_SETTINGS_CATEGORY {
  GENERAL = "general",
  WORK_STRUCTURE = "work-structure",
  EXECUTION = "execution",
}

export const PROJECT_SETTINGS_CATEGORIES: PROJECT_SETTINGS_CATEGORY[] = [
  PROJECT_SETTINGS_CATEGORY.GENERAL,
  PROJECT_SETTINGS_CATEGORY.WORK_STRUCTURE,
  PROJECT_SETTINGS_CATEGORY.EXECUTION,
];

export const PROJECT_SETTINGS: Record<TProjectSettingsTabs, TProjectSettingsItem> = {
  general: {
    key: "general",
    i18n_label: "common.general",
    href: ``,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/`,
  },
  members: {
    key: "members",
    i18n_label: "common.members",
    href: `/members`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/members/`,
  },
  features: {
    key: "features",
    i18n_label: "common.features",
    href: `/features`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/`,
  },
  states: {
    key: "states",
    i18n_label: "common.states",
    href: `/states`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/states/`,
  },
  labels: {
    key: "labels",
    i18n_label: "common.labels",
    href: `/labels`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/labels/`,
  },
  estimates: {
    key: "estimates",
    i18n_label: "common.estimates",
    href: `/estimates`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/estimates/`,
  },
  automations: {
    key: "automations",
    i18n_label: "project_settings.automations.label",
    href: `/automations`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/automations/`,
  },
};

export const GROUPED_PROJECT_SETTINGS: Record<PROJECT_SETTINGS_CATEGORY, TProjectSettingsItem[]> = {
  [PROJECT_SETTINGS_CATEGORY.GENERAL]: [
    PROJECT_SETTINGS["general"],
    PROJECT_SETTINGS["members"],
    PROJECT_SETTINGS["features"],
  ],
  [PROJECT_SETTINGS_CATEGORY.WORK_STRUCTURE]: [
    PROJECT_SETTINGS["states"],
    PROJECT_SETTINGS["labels"],
    PROJECT_SETTINGS["estimates"],
  ],
  [PROJECT_SETTINGS_CATEGORY.EXECUTION]: [PROJECT_SETTINGS["automations"]],
};
