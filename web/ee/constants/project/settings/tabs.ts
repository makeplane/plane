// plane types
import { EUserPermissions } from "@plane/types/src/enums";
// ui
import { EpicIcon } from "@plane/ui";
// ce constants
import { PROJECT_SETTINGS as PROJECT_SETTINGS_CE } from "@/ce/constants/project";
// icons
import { SettingIcon } from "@/components/icons/attachment";
// components
import { Props } from "@/components/icons/types";

export const PROJECT_SETTINGS = {
  ...PROJECT_SETTINGS_CE,
  "issue-types": {
    key: "issue-types",
    label: "Issue Types",
    href: `/settings/issue-types/`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/issue-types/`,
    Icon: SettingIcon,
  },
  epics: {
    key: "epics",
    label: "Epics",
    href: `/settings/epics/`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/epics/`,
    Icon: EpicIcon,
  },
  project_updates: {
    key: "project-updates",
    label: "Project Updates",
    href: `/settings/project-updates/`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-updates/`,
    Icon: SettingIcon,
  },
};

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  label: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  PROJECT_SETTINGS["general"],
  PROJECT_SETTINGS["members"],
  PROJECT_SETTINGS["features"],
  PROJECT_SETTINGS["states"],
  PROJECT_SETTINGS["labels"],
  PROJECT_SETTINGS["estimates"],
  PROJECT_SETTINGS["automations"],
  PROJECT_SETTINGS["issue-types"],
  PROJECT_SETTINGS["epics"],
  PROJECT_SETTINGS["project_updates"],
];
