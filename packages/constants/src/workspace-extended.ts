import { EUserWorkspaceRoles } from "./user";

export const EXTENDED_WORKSPACE_SETTINGS = {
  integrations: {
    key: "integrations",
    i18n_label: "workspace_settings.settings.integrations.title",
    href: `/settings/integrations`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname.includes(`${baseUrl}/settings/integrations/`),
  },
  import: {
    key: "import",
    i18n_label: "workspace_settings.settings.imports.title",
    href: `/settings/imports`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname.includes(`${baseUrl}/settings/imports/`),
  },
  worklogs: {
    key: "worklogs",
    i18n_label: "workspace_settings.settings.worklogs.title",
    href: `/settings/worklogs`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/worklogs/`,
  },
  project_states: {
    key: "project_states",
    i18n_label: "workspace_settings.settings.project_states.title",
    href: `/settings/project-states`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/project-states/`,
  },
  teamspaces: {
    key: "teamspaces",
    i18n_label: "workspace_settings.settings.teamspaces.title",
    href: `/settings/teamspaces`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/teamspaces/`,
  },
  initiatives: {
    key: "initiatives",
    i18n_label: "workspace_settings.settings.initiatives.title",
    href: `/settings/initiatives`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) =>
      pathname === `${baseUrl}/settings/initiatives/`,
  },
};
