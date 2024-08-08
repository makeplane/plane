// ce constants
import { PROJECT_SETTINGS as PROJECT_SETTINGS_CE } from "@/ce/constants/project";
// icons
import { SettingIcon } from "@/components/icons/attachment";
// types
import { Props } from "@/components/icons/types";
// constants
import { EUserProjectRoles } from "@/constants/project";

export const PROJECT_SETTINGS = {
  ...PROJECT_SETTINGS_CE,
  "issue-types": {
    key: "issue-types",
    label: "Issue types",
    href: `/settings/issue-types/`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/issue-types/`,
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
  PROJECT_SETTINGS["issue-types"],
];
