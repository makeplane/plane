// plane types
import { EUserPermissions, EUserProjectRoles } from "@plane/constants";
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
  "work-item-types": {
    key: "work-item-types",
    i18n_label: "work_item_types.label",
    href: `/work-item-types`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/work-item-types/`,
    Icon: SettingIcon,
  },
  workflows: {
    key: "workflows",
    i18n_label: "common.workflows",
    href: `/workflows`,
    access: [EUserPermissions.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/workflows/`,
    Icon: SettingIcon,
  },
  epics: {
    key: "epics",
    i18n_label: "common.epics",
    href: `/epics`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/epics/`,
    Icon: EpicIcon,
  },
  project_updates: {
    key: "project-updates",
    i18n_label: "common.project_updates",
    href: `/project-updates`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/project-updates/`,
    Icon: SettingIcon,
  },
  templates: {
    key: "templates",
    i18n_label: "common.templates",
    href: `/templates`,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname.startsWith(`${baseUrl}/templates/`),
    Icon: SettingIcon,
  },
};

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  access: EUserPermissions[] | EUserProjectRoles[];
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  PROJECT_SETTINGS["general"],
  PROJECT_SETTINGS["members"],
  PROJECT_SETTINGS["features"],
  PROJECT_SETTINGS["states"],
  PROJECT_SETTINGS["workflows"],
  PROJECT_SETTINGS["labels"],
  PROJECT_SETTINGS["estimates"],
  PROJECT_SETTINGS["automations"],
  PROJECT_SETTINGS["work-item-types"],
  PROJECT_SETTINGS["epics"],
  PROJECT_SETTINGS["project_updates"],
  PROJECT_SETTINGS["templates"],
];
