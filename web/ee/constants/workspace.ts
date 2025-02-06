import { InitiativeIcon } from "@plane/ui";
// ce constants
import { WORKSPACE_SETTINGS as WORKSPACE_SETTINGS_CE } from "@/ce/constants/workspace";
// components
import { SettingIcon } from "@/components/icons/attachment";
// constants
import { EUserPermissions } from "./user-permissions";

export const WORKSPACE_SETTINGS = {
  ...WORKSPACE_SETTINGS_CE,
  integrations: {
    key: "integrations",
    label: "Integrations",
    href: `/settings/integrations`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/integrations/`),
    Icon: SettingIcon,
  },
  import: {
    key: "import",
    label: "Imports",
    href: `/settings/imports`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/imports/`),
    Icon: SettingIcon,
  },
  worklogs: {
    key: "worklogs",
    label: "Worklogs",
    href: `/settings/worklogs`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/worklogs/`,
    Icon: SettingIcon,
  },
  project_states: {
    key: "project_states",
    label: "Project States",
    href: `/settings/project-states`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-states/`,
    Icon: SettingIcon,
  },
  teamspace: {
    key: "teamspace",
    label: "Teamspaces",
    href: `/settings/teamspaces`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/teamspaces/`,
    Icon: SettingIcon,
  },
  initiatives: {
    key: "initiatives",
    label: "Initiatives",
    href: `/settings/initiatives`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/initiatives/`,
    Icon: InitiativeIcon,
  },
};

export const WORKSPACE_SETTINGS_LINKS = [
  WORKSPACE_SETTINGS["general"],
  WORKSPACE_SETTINGS["members"],
  WORKSPACE_SETTINGS["project_states"],
  WORKSPACE_SETTINGS["billing-and-plans"],
  WORKSPACE_SETTINGS["integrations"],
  WORKSPACE_SETTINGS["import"],
  WORKSPACE_SETTINGS["export"],
  WORKSPACE_SETTINGS["webhooks"],
  WORKSPACE_SETTINGS["api-tokens"],
  WORKSPACE_SETTINGS["worklogs"],
  WORKSPACE_SETTINGS["teamspace"],
  WORKSPACE_SETTINGS["initiatives"],
];
