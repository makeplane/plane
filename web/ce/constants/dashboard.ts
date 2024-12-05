"use client";

// icons
import { Home, Inbox, PenSquare } from "lucide-react";
// ui
import { UserActivityIcon } from "@plane/ui";
import { Props } from "@/components/icons/types";
import { TLinkOptions } from "@/constants/dashboard";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web types
import { TSidebarUserMenuItemKeys } from "@/plane-web/types/dashboard";

export type TSidebarUserMenuItems = {
  key: TSidebarUserMenuItemKeys;
  label: string;
  href: string;
  access: EUserPermissions[];
  highlight: (pathname: string, baseUrl: string, options?: TLinkOptions) => boolean;
  Icon: React.FC<Props>;
};

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
