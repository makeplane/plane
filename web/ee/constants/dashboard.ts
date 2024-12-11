import { PiChatLogo } from "@plane/ui";
import { SIDEBAR_USER_MENU_ITEMS } from "@/ce/constants/dashboard";
import { EUserPermissions } from "./user-permissions";

SIDEBAR_USER_MENU_ITEMS.push({
  key: "pi-chat",
  label: "Pi chat",
  href: `/pi-chat`,
  access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
  highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/pi-chat/`),
  Icon: PiChatLogo,
});

export { SIDEBAR_USER_MENU_ITEMS };
