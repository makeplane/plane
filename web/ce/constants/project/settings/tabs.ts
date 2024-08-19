// icons
import { SettingIcon } from "@/components/icons/attachment";
// types
import { Props } from "@/components/icons/types";
// constants
import { EUserProjectRoles } from "@/constants/project";

export const PROJECT_SETTINGS = {
  general: {
    key: "general",
    label: "General",
    href: `/settings`,
    access: EUserProjectRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
    Icon: SettingIcon,
  },
  members: {
    key: "members",
    label: "Members",
    href: `/settings/members`,
    access: EUserProjectRoles.VIEWER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
    Icon: SettingIcon,
  },
  features: {
    key: "features",
    label: "Features",
    href: `/settings/features`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/features/`,
    Icon: SettingIcon,
  },
  states: {
    key: "states",
    label: "States",
    href: `/settings/states`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/states/`,
    Icon: SettingIcon,
  },
  labels: {
    key: "labels",
    label: "Labels",
    href: `/settings/labels`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/labels/`,
    Icon: SettingIcon,
  },
  estimates: {
    key: "estimates",
    label: "Estimates",
    href: `/settings/estimates`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/estimates/`,
    Icon: SettingIcon,
  },
  automations: {
    key: "automations",
    label: "Automations",
    href: `/settings/automations`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/automations/`,
    Icon: SettingIcon,
  },
};

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  label: string;
  href: string;
  access: EUserProjectRoles;
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
];
