"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// ui
import { Tooltip } from "@plane/ui";
// components
import { NotificationAppSidebarOption } from "@/components/workspace-notifications";
// constants
import { SIDEBAR_USER_MENU_ITEMS } from "@/constants/dashboard";
import { SIDEBAR_CLICKED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const SidebarUserMenu = observer(() => {
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
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
    <div
      className={cn("w-full space-y-1", {
        "space-y-0": sidebarCollapsed,
      })}
    >
      {SIDEBAR_USER_MENU_ITEMS.map(
        (link) =>
          workspaceMemberInfo >= link.access && (
            <Link key={link.key} href={`/${workspaceSlug}${link.href}`} onClick={() => handleLinkClick(link.key)}>
              <Tooltip
                tooltipContent={link.label}
                position="right"
                className="ml-2"
                disabled={!sidebarCollapsed}
                isMobile={isMobile}
              >
                <div
                  className={cn(
                    "relative group w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90",
                    {
                      "text-custom-primary-100 bg-custom-primary-100/10 hover:bg-custom-primary-100/10": link.highlight(
                        pathname,
                        `/${workspaceSlug}`
                      ),
                      "p-0 size-8 aspect-square justify-center mx-auto": sidebarCollapsed,
                    }
                  )}
                >
                  <span className="flex-shrink-0 size-4 grid place-items-center">
                    <link.Icon className="size-4" />
                  </span>
                  {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
                  {link.key === "notifications" && (
                    <NotificationAppSidebarOption
                      workspaceSlug={workspaceSlug.toString()}
                      isSidebarCollapsed={sidebarCollapsed ?? false}
                    />
                  )}
                </div>
              </Tooltip>
            </Link>
          )
      )}
    </div>
  );
});
