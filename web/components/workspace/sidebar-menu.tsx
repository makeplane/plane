import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { NotificationPopover } from "components/notifications";
// ui
import { Tooltip } from "@plane/ui";
import { Crown } from "lucide-react";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { SIDEBAR_MENU_ITEMS } from "constants/dashboard";
// helper
import { cn } from "helpers/common.helper";

export const WorkspaceSidebarMenu = observer(() => {
  // store hooks
  const { theme: themeStore } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // computed
  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      themeStore.toggleSidebar();
    }
  };

  return (
    <div className="w-full cursor-pointer space-y-2 p-4">
      {SIDEBAR_MENU_ITEMS.map(
        (link) =>
          workspaceMemberInfo >= link.access && (
            <Link key={link.key}
              href={`/${workspaceSlug}${link.href}`}
              onClick={handleLinkClick}
            >
              <span className="block w-full my-1">
                <Tooltip
                  tooltipContent={link.label}
                  position="right"
                  className="ml-2"
                  disabled={!themeStore?.sidebarCollapsed}
                >
                  <div
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${link.highlight(router.asPath, `/${workspaceSlug}`)
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                      } ${themeStore?.sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    {
                      <link.Icon
                        className={cn("h-4 w-4", {
                          "rotate-180": link.key === "active-cycles",
                        })}
                      />
                    }
                    {!themeStore?.sidebarCollapsed && link.label}
                    {!themeStore?.sidebarCollapsed && link.key === "active-cycles" && (
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                </Tooltip>
              </span>
            </Link>
          )
      )}
      <NotificationPopover />
    </div>
  );
});
