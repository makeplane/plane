"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// components
import { Tooltip } from "@plane/ui";
import { SidebarNavItem } from "@/components/sidebar";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications";
// constants
import { SIDEBAR_USER_MENU_ITEMS } from "@/constants/dashboard";
import { SIDEBAR_CLICKED } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useUser, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const SidebarUserMenu = observer(() => {
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  // computed

  const getHref = (link: any) =>
    `/${workspaceSlug}${link.href}${link.key === "your-work" ? `/${currentUser?.id}` : ""}`;

  const handleLinkClick = (itemKey: string) => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    captureEvent(SIDEBAR_CLICKED, {
      destination: itemKey,
    });
  };

  const notificationIndicatorElement = (
    <NotificationAppSidebarOption
      workspaceSlug={workspaceSlug.toString()}
      isSidebarCollapsed={sidebarCollapsed ?? false}
    />
  );

  return (
    <div
      className={cn("flex flex-col gap-0.5", {
        "space-y-0": sidebarCollapsed,
      })}
    >
      {SIDEBAR_USER_MENU_ITEMS.map(
        (link) =>
          allowPermissions(link.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()) && (
            <Tooltip
              key={link.key}
              tooltipContent={link.label}
              position="right"
              className="ml-2"
              disabled={!sidebarCollapsed}
              isMobile={isMobile}
            >
              <Link key={link.key} href={getHref(link)} onClick={() => handleLinkClick(link.key)}>
                <SidebarNavItem
                  className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
                  isActive={link.highlight(pathname, `/${workspaceSlug}`, { userId: currentUser?.id })}
                >
                  <div className="flex items-center gap-1.5 py-[1px]">
                    <link.Icon className="size-4 flex-shrink-0" />
                    {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
                  </div>
                  {link.key === "notifications" && notificationIndicatorElement}
                </SidebarNavItem>
              </Link>
            </Tooltip>
          )
      )}
    </div>
  );
});
