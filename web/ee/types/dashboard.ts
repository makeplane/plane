import {
  TSidebarUserMenuItemKeys as BaseTSidebarUserMenuItemKeys,
  TSidebarWorkspaceMenuItemKeys as BaseTSidebarWorkspaceMenuItemKeys,
} from "@/ce/types/dashboard";

export type TSidebarUserMenuItemKeys = BaseTSidebarUserMenuItemKeys | "pi-chat";

export type TSidebarWorkspaceMenuItemKeys = BaseTSidebarWorkspaceMenuItemKeys | "initiatives" | "teams";
