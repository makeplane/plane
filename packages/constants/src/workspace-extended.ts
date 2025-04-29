import { EUserWorkspaceRoles } from "./user";
import { IWorkspaceSidebarNavigationItem } from "./workspace";

export const EXTENDED_WORKSPACE_SETTINGS = {
  integrations: {
    key: "integrations",
    i18n_label: "workspace_settings.settings.integrations.title",
    href: `/settings/integrations`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/integrations/`),
  },
  import: {
    key: "import",
    i18n_label: "workspace_settings.settings.imports.title",
    href: `/settings/imports`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/imports/`),
  },
  worklogs: {
    key: "worklogs",
    i18n_label: "workspace_settings.settings.worklogs.title",
    href: `/settings/worklogs`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/worklogs/`,
  },
  project_states: {
    key: "project_states",
    i18n_label: "workspace_settings.settings.project_states.title",
    href: `/settings/project-states`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-states/`,
  },
  teamspaces: {
    key: "teamspaces",
    i18n_label: "workspace_settings.settings.teamspaces.title",
    href: `/settings/teamspaces`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/teamspaces/`,
  },
  initiatives: {
    key: "initiatives",
    i18n_label: "workspace_settings.settings.initiatives.title",
    href: `/settings/initiatives`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/initiatives/`,
  },
  customers: {
    key: "customers",
    i18n_label: "workspace_settings.settings.customers.title",
    href: "/settings/customers",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/customers/`,
  },
  applications: {
    key: "applications",
    i18n_label: "workspace_settings.settings.applications.title",
    href: "/settings/applications",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/applications/`),
  },
  templates: {
    key: "templates",
    i18n_label: "common.templates",
    href: "/settings/templates",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/templates/`),
  },
};

export const EXTENDED_WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  dashboards: {
    key: "dashboards",
    labelTranslationKey: "workspace_dashboards",
    href: `/dashboards/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  },
  "active-cycles": {
    key: "active_cycles",
    labelTranslationKey: "cycles",
    href: `/active-cycles/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  },
  initiatives: {
    key: "initiatives",
    labelTranslationKey: "initiatives.label",
    href: `/initiatives/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  },
  teamspaces: {
    key: "team_spaces",
    labelTranslationKey: "teamspaces.label",
    href: `/teamspaces/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  },
  customers: {
    key: "customers",
    labelTranslationKey: "sidebar.customers",
    href: `/customers`,
    access: [EUserWorkspaceRoles.ADMIN],
  },
};

export const EXTENDED_WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  "pi-chat": {
    key: "pi_chat",
    labelTranslationKey: "pi_chat",
    href: `/pi-chat`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
  },
};

export const EXTENDED_WORKSPACE_RESULT_ENTITIES = {
  epic: [],
  team: [],
  initiative: [],
};
