// icons
import { SettingIcon } from "@/components/icons/attachment";
import { Props } from "@/components/icons/types";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";

export const WORKSPACE_SETTINGS_LINKS: {
  key: string;
  label: string;
  href: string;
  access: EUserWorkspaceRoles;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  {
    key: "general",
    label: "General",
    href: `/settings`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
    Icon: SettingIcon,
  },
  {
    key: "members",
    label: "Members",
    href: `/settings/members`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
    Icon: SettingIcon,
  },
  {
    key: "billing-and-plans",
    label: "Billing and plans",
    href: `/settings/billing`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/billing/`,
    Icon: SettingIcon,
  },
  {
    key: "export",
    label: "Exports",
    href: `/settings/exports`,
    access: EUserWorkspaceRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports/`,
    Icon: SettingIcon,
  },
  {
    key: "webhooks",
    label: "Webhooks",
    href: `/settings/webhooks`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks/`,
    Icon: SettingIcon,
  },
  {
    key: "api-tokens",
    label: "API tokens",
    href: `/settings/api-tokens`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/api-tokens/`,
    Icon: SettingIcon,
  },
];
