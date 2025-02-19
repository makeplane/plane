// plane types
import { BoxesIcon } from "lucide-react";
import { EUserPermissions, EUserProjectRoles } from "@plane/constants";
// ui
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
    href: `/settings/work-item-types/`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/work-item-types/`,
    Icon: SettingIcon,
  },
  epics: {
    key: "epics",
    i18n_label: "common.epics",
    href: `/settings/epics/`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/epics/`,
    Icon: BoxesIcon,
  },
  project_updates: {
    key: "project-updates",
    i18n_label: "common.project_updates",
    href: `/settings/project-updates/`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-updates/`,
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
  PROJECT_SETTINGS["labels"],
  PROJECT_SETTINGS["estimates"],
  PROJECT_SETTINGS["automations"],
  PROJECT_SETTINGS["work-item-types"],
  PROJECT_SETTINGS["epics"],
  PROJECT_SETTINGS["project_updates"],
];
