// icons
import { Globe2, Lock, LucideIcon } from "lucide-react";
import { TProjectAppliedDisplayFilterKeys, TProjectOrderByOptions } from "@plane/types";
import { SettingIcon } from "@/components/icons/attachment";
// types
import { Props } from "@/components/icons/types";

export enum EUserProjectRoles {
  GUEST = 5,
  VIEWER = 10,
  MEMBER = 15,
  ADMIN = 20,
}

export const NETWORK_CHOICES: {
  key: 0 | 2;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: 0,
    label: "Private",
    description: "Accessible only by invite",
    icon: Lock,
  },
  {
    key: 2,
    label: "Public",
    description: "Anyone in the workspace can join",
    icon: Globe2,
  },
];

export const GROUP_CHOICES = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_AUTOMATION_MONTHS = [
  { label: "1 month", value: 1 },
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
  { label: "9 months", value: 9 },
  { label: "12 months", value: 12 },
];

export const PROJECT_UNSPLASH_COVERS = [
  "https://images.unsplash.com/photo-1531045535792-b515d59c3d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1693027407934-e3aa8a54c7ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1464925257126-6450e871c667?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1606768666853-403c90a981ad?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1627556592933-ffe99c1cd9eb?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1643330683233-ff2ac89b002c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1475738972911-5b44ce984c42?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1673393058808-50e9baaf4d2c?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1696643830146-44a8755f1905?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
  "https://images.unsplash.com/photo-1693868769698-6c7440636a09?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1691230995681-480d86cbc135?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
  "https://images.unsplash.com/photo-1675351066828-6fc770b90dd2?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80",
];

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  label: string;
  href: string;
  access: EUserProjectRoles;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  {
    key: "general",
    label: "General",
    href: `/settings`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
    Icon: SettingIcon,
  },
  {
    key: "members",
    label: "Members",
    href: `/settings/members`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
    Icon: SettingIcon,
  },
  {
    key: "features",
    label: "Features",
    href: `/settings/features`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/features/`,
    Icon: SettingIcon,
  },
  {
    key: "states",
    label: "States",
    href: `/settings/states`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/states/`,
    Icon: SettingIcon,
  },
  {
    key: "labels",
    label: "Labels",
    href: `/settings/labels`,
    access: EUserProjectRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/labels/`,
    Icon: SettingIcon,
  },
  {
    key: "estimates",
    label: "Estimates",
    href: `/settings/estimates`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/estimates/`,
    Icon: SettingIcon,
  },
  {
    key: "automations",
    label: "Automations",
    href: `/settings/automations`,
    access: EUserProjectRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/automations/`,
    Icon: SettingIcon,
  },
];

export const PROJECT_ORDER_BY_OPTIONS: {
  key: TProjectOrderByOptions;
  label: string;
}[] = [
  {
    key: "sort_order",
    label: "Manual",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "created_at",
    label: "Created date",
  },
  {
    key: "members_length",
    label: "Number of members",
  },
];

export const PROJECT_DISPLAY_FILTER_OPTIONS: {
  key: TProjectAppliedDisplayFilterKeys;
  label: string;
}[] = [
  {
    key: "my_projects",
    label: "My projects",
  },
  {
    key: "archived_projects",
    label: "Archived",
  },
];
