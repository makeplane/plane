// ce constants
import { WORKSPACE_SETTINGS as WORKSPACE_SETTINGS_CE } from "@/ce/constants/workspace";
// components
import { SettingIcon } from "@/components/icons/attachment";
// constants
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
// logos
import JiraLogo from "@/public/services/jira.svg";
import LinearLogo from "@/public/services/linear.svg";
import { EUserPermissions } from "./user-permissions";

export const WORKSPACE_SETTINGS = {
  ...WORKSPACE_SETTINGS_CE,
  integrations: {
    key: "integrations",
    label: "Integrations",
    href: `/settings/integrations`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/integrations/`,
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
];

export const IMPORTERS_LIST = [
  {
    key: E_FEATURE_FLAGS.SILO_JIRA_INTEGRATION,
    provider: "jira",
    type: "Import",
    title: "Jira",
    description: "Import your Jira data into Plane projects.",
    logo: JiraLogo,
  },
  {
    key: E_FEATURE_FLAGS.SILO_LINEAR_INTEGRATION,
    provider: "linear",
    type: "Import",
    title: "Linear",
    description: "Import your Linear data into Plane projects.",
    logo: LinearLogo,
  },
];
