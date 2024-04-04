import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Crown } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// components
import { NotificationPopover } from "@/components/notifications";
// constants
import { SIDEBAR_MENU_ITEMS } from "@/constants/dashboard";
import { SIDEBAR_CLICKED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const WorkspaceSidebarMenu = observer(() => {
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // computed
  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const handleLinkClick = (itemKey: string) => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    captureEvent(SIDEBAR_CLICKED, {
      destination: itemKey,
    });
  };

  return (
    <div className="w-full cursor-pointer space-y-2 p-4">
      {SIDEBAR_MENU_ITEMS.map(
        (link) =>
          workspaceMemberInfo >= link.access && (
            <Link key={link.key} href={`/${workspaceSlug}${link.href}`} onClick={() => handleLinkClick(link.key)}>
              <span className="my-1 block w-full">
                <Tooltip
                  tooltipContent={link.label}
                  position="right"
                  className="ml-2"
                  disabled={!sidebarCollapsed}
                  isMobile={isMobile}
                >
                  <div
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                      link.highlight(router.asPath, `/${workspaceSlug}`)
                        ? "bg-custom-primary-100/10 text-custom-primary-100"
                        : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    {
                      <link.Icon
                        className={cn("h-4 w-4", {
                          "rotate-180": link.key === "active-cycles",
                        })}
                      />
                    }
                    {!sidebarCollapsed && <p className="leading-5">{link.label}</p>}
                    {!sidebarCollapsed && link.key === "active-cycles" && (
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
