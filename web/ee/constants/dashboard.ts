// ee types
import { TSidebarWorkspaceMenuItemKeys } from "ee/types/dashboard";
// ui
import { PiChatLogo, TeamsIcon } from "@plane/ui";
// ce constants
import {
  SIDEBAR_USER_MENU_ITEMS,
  SIDEBAR_WORKSPACE_MENU as CE_SIDEBAR_WORKSPACE_MENU,
  TSidebarWorkspaceMenuItems,
} from "@/ce/constants/dashboard";
// ee constants
import { EUserPermissions } from "./user-permissions";

SIDEBAR_USER_MENU_ITEMS.push({
  key: "pi-chat",
  label: "Pi chat",
  href: `/pi-chat`,
  access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
  highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/pi-chat/`),
  Icon: PiChatLogo,
});

export const SIDEBAR_WORKSPACE_MENU: Partial<Record<TSidebarWorkspaceMenuItemKeys, TSidebarWorkspaceMenuItems>> = {
  ...CE_SIDEBAR_WORKSPACE_MENU,
  teams: {
    key: "teams",
    label: "Teams",
    href: `/teams`,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/teams/`,
    Icon: TeamsIcon,
  },
};

export const SIDEBAR_WORKSPACE_MENU_ITEMS: TSidebarWorkspaceMenuItems[] = [
  SIDEBAR_WORKSPACE_MENU?.teams,
  SIDEBAR_WORKSPACE_MENU?.projects,
  SIDEBAR_WORKSPACE_MENU?.["all-issues"],
  SIDEBAR_WORKSPACE_MENU?.["active-cycles"],
  SIDEBAR_WORKSPACE_MENU?.analytics,
].filter((item): item is TSidebarWorkspaceMenuItems => item !== undefined);

export { SIDEBAR_USER_MENU_ITEMS };

