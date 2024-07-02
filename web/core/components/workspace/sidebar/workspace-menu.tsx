"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Crown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
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
import useLocalStorage from "@/hooks/use-local-storage";
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
  // local storage
  const { setValue: toggleWorkspaceMenu, storedValue } = useLocalStorage<boolean>("is_workspace_menu_open", true);
  // derived values
  const isWorkspaceMenuOpen = !!storedValue;
  // auth
  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const handleLinkClick = (itemKey: string) => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    captureEvent(SIDEBAR_CLICKED, {
      destination: itemKey,
    });
  };

  useEffect(() => {
    if (sidebarCollapsed) toggleWorkspaceMenu(true);
  }, [sidebarCollapsed, toggleWorkspaceMenu]);

  return (
    <Disclosure as="div" defaultOpen>
      {!sidebarCollapsed && (
        <Disclosure.Button
          as="button"
          className="group/workspace-button w-full px-2 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-sm font-semibold"
          onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
        >
          <span>Workspace</span>
          <span className="flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded p-0.5 hover:bg-custom-sidebar-background-80">
            <ChevronRight
              className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                "rotate-90": isWorkspaceMenuOpen,
              })}
            />
          </span>
        </Disclosure.Button>
      )}
      <Transition
        show={isWorkspaceMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isWorkspaceMenuOpen && (
          <Disclosure.Panel
            as="div"
            className={cn("mt-2 ml-1 space-y-1", {
              "space-y-0 mt-0 ml-0": sidebarCollapsed,
            })}
            static
          >
            {SIDEBAR_WORKSPACE_MENU_ITEMS.map(
              (link) =>
                workspaceMemberInfo >= link.access && (
                  <Link
                    key={link.key}
                    href={`/${workspaceSlug}${link.href}`}
                    onClick={() => handleLinkClick(link.key)}
                    className="block"
                  >
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
                            "p-0 size-8 aspect-square justify-center mx-auto": sidebarCollapsed,
                          }
                        )}
                      >
                        <span className="flex-shrink-0 size-4 grid place-items-center">
                          <link.Icon
                            className={cn("size-4", {
                              "rotate-180": link.key === "active-cycles",
                            })}
                          />
                        </span>
                        {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
                        {!sidebarCollapsed && link.key === "active-cycles" && (
                          <Crown className="size-3.5 text-amber-400" />
                        )}
                      </div>
                    </Tooltip>
                  </Link>
                )
            )}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
