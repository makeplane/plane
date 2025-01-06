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

export type TSidebarWorkspaceMenuItems = TSidebarMenuItems<TSidebarWorkspaceMenuItemKeys>;
