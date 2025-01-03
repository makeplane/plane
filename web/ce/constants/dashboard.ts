"use client";

// icons
import { Briefcase, Home, Inbox, Layers, PenSquare, BarChart2 } from "lucide-react";
// ui
import { UserActivityIcon, ContrastIcon } from "@plane/ui";
import { Props } from "@/components/icons/types";
// constants
import { TLinkOptions } from "@/constants/dashboard";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web types
import { TSidebarUserMenuItemKeys, TSidebarWorkspaceMenuItemKeys } from "@/plane-web/types/dashboard";

export type TSidebarMenuItems<T extends TSidebarUserMenuItemKeys | TSidebarWorkspaceMenuItemKeys> = {
  value: T;
  label: string;
  key: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string, options?: TLinkOptions) => boolean;
  Icon: React.FC<Props>;
};

export type TSidebarUserMenuItems = TSidebarMenuItems<TSidebarUserMenuItemKeys>;

export const SIDEBAR_USER_MENU_ITEMS: TSidebarUserMenuItems[] = [
  {
    value: "home",
    label: "Home",
    key: "home",
    href: ``,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/`,
    Icon: Home,
  },
  {
    value: "your-work",
    label: "Your work",
    key: "your_work",
    href: "/profile",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string, options?: TLinkOptions) =>
      options?.userId ? pathname.includes(`${baseUrl}/profile/${options?.userId}`) : false,
    Icon: UserActivityIcon,
  },
  {
    value: "notifications",
    label: "Inbox",
    key: "notifications",
    href: `/notifications`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/notifications/`),
    Icon: Inbox,
  },
  {
    value: "drafts",
    label: "Drafts",
    key: "drafts",
    href: `/drafts`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/drafts/`),
    Icon: PenSquare,
  },
];

export type TSidebarWorkspaceMenuItems = TSidebarMenuItems<TSidebarWorkspaceMenuItemKeys>;

export const SIDEBAR_WORKSPACE_MENU: Partial<Record<TSidebarWorkspaceMenuItemKeys, TSidebarWorkspaceMenuItems>> = {
  projects: {
    value: "projects",
    key: "projects",
    label: "Projects",
    href: `/projects`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/projects/`,
    Icon: Briefcase,
  },
  "all-issues": {
    value: "all-issues",
    key: "views",
    label: "Views",
    href: `/workspace-views/all-issues`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/workspace-views/`),
    Icon: Layers,
  },
  "active-cycles": {
    value: "active-cycles",
    key: "active_cycles",
    label: "Cycles",
    href: `/active-cycles`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/active-cycles/`,
    Icon: ContrastIcon,
  },
  analytics: {
    value: "analytics",
    key: "analytics",
    label: "Analytics",
    href: `/analytics`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/analytics/`),
    Icon: BarChart2,
  },
};

export const SIDEBAR_WORKSPACE_MENU_ITEMS: TSidebarWorkspaceMenuItems[] = [
  SIDEBAR_WORKSPACE_MENU?.projects,
  SIDEBAR_WORKSPACE_MENU?.["all-issues"],
  SIDEBAR_WORKSPACE_MENU?.["active-cycles"],
  SIDEBAR_WORKSPACE_MENU?.analytics,
].filter((item): item is TSidebarWorkspaceMenuItems => item !== undefined);
