// icons
import { EUserPermissions } from "./../user";

export const PROJECT_SETTINGS = {
  general: {
    key: "general",
    i18n_label: "common.general",
    href: `/settings`,
    access: [
      EUserPermissions.ADMIN,
      EUserPermissions.MEMBER,
      EUserPermissions.GUEST,
    ],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "members",
    href: `/settings/members`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/members/`,
  },
  features: {
    key: "features",
    i18n_label: "common.features",
    href: `/settings/features`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/features/`,
  },
  states: {
    key: "states",
    i18n_label: "common.states",
    href: `/settings/states`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/states/`,
  },
  labels: {
    key: "labels",
    i18n_label: "common.labels",
    href: `/settings/labels`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/labels/`,
  },
  estimates: {
    key: "estimates",
    i18n_label: "common.estimates",
    href: `/settings/estimates`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/estimates/`,
  },
  automations: {
    key: "automations",
    i18n_label: "project_settings.automations.label",
    href: `/settings/automations`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/automations/`,
  },
};

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string) => boolean;
}[] = [
  PROJECT_SETTINGS["general"],
  PROJECT_SETTINGS["members"],
  PROJECT_SETTINGS["features"],
  PROJECT_SETTINGS["states"],
  PROJECT_SETTINGS["labels"],
  PROJECT_SETTINGS["estimates"],
  PROJECT_SETTINGS["automations"],
];
