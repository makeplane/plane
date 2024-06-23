"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronUp, Crown } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { SIDEBAR_WORKSPACE_MENU_ITEMS } from "@/constants/dashboard";
import { SIDEBAR_CLICKED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const SidebarWorkspaceMenu = observer(() => {
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
    <Disclosure as="div" defaultOpen>
      <Disclosure.Button
        as="button"
        className="flex items-center gap-1 text-sm font-medium text-custom-sidebar-text-400 px-2 py-0.5 hover:bg-custom-sidebar-background-90 rounded"
      >
        {({ open }) => (
          <>
            <span>Workspace</span>
            <ChevronUp
              className={cn("flex-shrink-0 size-3.5 transition-all", {
                "rotate-180": open,
              })}
            />
          </>
        )}
      </Disclosure.Button>
      <Disclosure.Panel as="div" className="mt-3 space-y-1">
        {SIDEBAR_WORKSPACE_MENU_ITEMS.map(
          (link) =>
            workspaceMemberInfo >= link.access && (
              <Link
                key={link.key}
                href={`/${workspaceSlug}${link.href}`}
                onClick={() => handleLinkClick(link.key)}
                className="block"
              >
                <span className="block w-full">
                  <Tooltip
                    tooltipContent={link.label}
                    position="right"
                    className="ml-2"
                    disabled={!sidebarCollapsed}
                    isMobile={isMobile}
                  >
                    <div
                      className={cn(
                        "group w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90",
                        {
                          "text-custom-primary-100 bg-custom-primary-100/10 hover:bg-custom-primary-100/10":
                            link.highlight(pathname, `/${workspaceSlug}`),
                          "justify-center": sidebarCollapsed,
                        }
                      )}
                    >
                      {
                        <link.Icon
                          className={cn("size-4", {
                            "rotate-180": link.key === "active-cycles",
                          })}
                        />
                      }
                      {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
                      {!sidebarCollapsed && link.key === "active-cycles" && (
                        <Crown className="size-3.5 text-amber-400" />
                      )}
                    </div>
                  </Tooltip>
                </span>
              </Link>
            )
        )}
      </Disclosure.Panel>
    </Disclosure>
  );
});
