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
  key: T;
  label: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string, options?: TLinkOptions) => boolean;
  Icon: React.FC<Props>;
};

export type TSidebarUserMenuItems = TSidebarMenuItems<TSidebarUserMenuItemKeys>;

export const SIDEBAR_USER_MENU_ITEMS: TSidebarUserMenuItems[] = [
  {
    key: "home",
    label: "Home",
    href: ``,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/`,
    Icon: Home,
  },
  {
    key: "your-work",
    label: "Your work",
    href: "/profile",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string, options?: TLinkOptions) =>
      options?.userId ? pathname.includes(`${baseUrl}/profile/${options?.userId}`) : false,
    Icon: UserActivityIcon,
  },
  {
    key: "notifications",
    label: "Inbox",
    href: `/notifications`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/notifications/`),
    Icon: Inbox,
  },
  {
    key: "drafts",
    label: "Drafts",
    href: `/drafts`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/drafts/`),
    Icon: PenSquare,
  },
];

export type TSidebarWorkspaceMenuItems = TSidebarMenuItems<TSidebarWorkspaceMenuItemKeys>;

export const SIDEBAR_WORKSPACE_MENU: Partial<Record<TSidebarWorkspaceMenuItemKeys, TSidebarWorkspaceMenuItems>> = {
  projects: {
    key: "projects",
    label: "Projects",
    href: `/projects`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/projects/`,
    Icon: Briefcase,
  },
  "all-issues": {
    key: "all-issues",
    label: "Views",
    href: `/workspace-views/all-issues`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/workspace-views/`),
    Icon: Layers,
  },
  "active-cycles": {
    key: "active-cycles",
    label: "Cycles",
    href: `/active-cycles`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/active-cycles/`,
    Icon: ContrastIcon,
  },
  analytics: {
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
