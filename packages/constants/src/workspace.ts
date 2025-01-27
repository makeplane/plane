import { EUserWorkspaceRoles } from "./user";

export const ORGANIZATION_SIZE = [
  "Just myself", // TODO: translate
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

export const RESTRICTED_URLS = [
  "404",
  "accounts",
  "api",
  "create-workspace",
  "god-mode",
  "installations",
  "invitations",
  "onboarding",
  "profile",
  "spaces",
  "workspace-invitations",
  "password",
  "flags",
  "monitor",
  "monitoring",
  "ingest",
  "plane-pro",
  "plane-ultimate",
  "enterprise",
  "plane-enterprise",
  "disco",
  "silo",
  "chat",
  "calendar",
  "drive",
  "channels",
  "upgrade",
  "billing",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "config",
  "live",
  "admin",
  "m",
  "import",
  "importers",
  "integrations",
  "integration",
  "configuration",
  "initiatives",
  "initiative",
  "config",
  "workflow",
  "workflows",
  "epics",
  "epic",
  "story",
  "mobile",
  "dashboard",
  "desktop",
  "onload",
  "real-time",
  "one",
  "pages",
  "mobile",
  "business",
  "pro",
  "settings",
  "monitor",
  "license",
  "licenses",
  "instances",
  "instance",
];

export const WORKSPACE_SETTINGS = {
  general: {
    key: "general",
    i18n_label: "workspace_settings.settings.general.title",
    href: `/settings`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "workspace_settings.settings.members.title",
    href: `/settings/members`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/members/`,
  },
  "billing-and-plans": {
    key: "billing-and-plans",
    i18n_label: "workspace_settings.settings.billing_and_plans.title",
    href: `/settings/billing`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/billing/`,
  },
  export: {
    key: "export",
    i18n_label: "workspace_settings.settings.exports.title",
    href: `/settings/exports`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/exports/`,
  },
  webhooks: {
    key: "webhooks",
    i18n_label: "workspace_settings.settings.webhooks.title",
    href: `/settings/webhooks`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/webhooks/`,
  },
  "api-tokens": {
    key: "api-tokens",
    i18n_label: "workspace_settings.settings.webhooks.title",
    href: `/settings/api-tokens`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/api-tokens/`,
  },
};

export const WORKSPACE_SETTINGS_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  access: EUserWorkspaceRoles[];
  highlight: (pathname: string, baseUrl: string) => boolean;
}[] = [
  WORKSPACE_SETTINGS["general"],
  WORKSPACE_SETTINGS["members"],
  WORKSPACE_SETTINGS["billing-and-plans"],
  WORKSPACE_SETTINGS["export"],
  WORKSPACE_SETTINGS["webhooks"],
  WORKSPACE_SETTINGS["api-tokens"],
];
