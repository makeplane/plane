"use client";
import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, Ellipsis } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import {
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// store hooks
import { useAppTheme, useWorkspace } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
// plane-web imports
import { SidebarItem } from "@/plane-web/components/workspace/sidebar";

export const SidebarMenuItems = observer(() => {
  // routers
  const { workspaceSlug } = useParams();
  const { setValue: toggleWorkspaceMenu, storedValue: isWorkspaceMenuOpen } = useLocalStorage<boolean>(
    "is_workspace_menu_open",
    true
  );

  // store hooks
  const { isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();
  const { getNavigationPreferences } = useWorkspace();
  // translation
  const { t } = useTranslation();
  // derived values
  const currentWorkspaceNavigationPreferences = getNavigationPreferences(workspaceSlug.toString());

  const toggleListDisclosure = (isOpen: boolean) => {
    toggleWorkspaceMenu(isOpen);
  };

  const sortedNavigationItems = useMemo(
    () =>
      WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.map((item) => {
        const preference = currentWorkspaceNavigationPreferences?.[item.key];
        return {
          ...item,
          sort_order: preference ? preference.sort_order : 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order),
    [currentWorkspaceNavigationPreferences]
  );

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
          <SidebarItem key={`static_${_index}`} item={item} />
        ))}
      </div>
      <Disclosure as="div" className="flex flex-col" defaultOpen={!!isWorkspaceMenuOpen}>
        <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90">
          <Disclosure.Button
            as="button"
            type="button"
            className="w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
            onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
            aria-label={t(
              isWorkspaceMenuOpen
                ? "aria_labels.app_sidebar.close_workspace_menu"
                : "aria_labels.app_sidebar.open_workspace_menu"
            )}
          >
            <span className="text-sm font-semibold">{t("workspace")}</span>
          </Disclosure.Button>
          <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
            <Disclosure.Button
              as="button"
              type="button"
              className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
              onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
              aria-label={t(
                isWorkspaceMenuOpen
                  ? "aria_labels.app_sidebar.close_workspace_menu"
                  : "aria_labels.app_sidebar.open_workspace_menu"
              )}
            >
              <ChevronRight
                className={cn("flex-shrink-0 size-3 transition-all", {
                  "rotate-90": isWorkspaceMenuOpen,
                })}
              />
            </Disclosure.Button>
          </div>
        </div>
        <Transition
          show={!!isWorkspaceMenuOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isWorkspaceMenuOpen && (
            <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
              <>
                {WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
                  <SidebarItem key={`static_${_index}`} item={item} />
                ))}
                {sortedNavigationItems.map((item, _index) => (
                  <SidebarItem key={`dynamic_${_index}`} item={item} />
                ))}
                <SidebarNavItem>
                  <button
                    type="button"
                    onClick={() => toggleExtendedSidebar()}
                    className="flex items-center gap-1.5 text-sm font-medium flex-grow text-custom-text-350"
                    id="extended-sidebar-toggle"
                    aria-label={t(
                      isExtendedSidebarOpened
                        ? "aria_labels.app_sidebar.close_extended_sidebar"
                        : "aria_labels.app_sidebar.open_extended_sidebar"
                    )}
                  >
                    <Ellipsis className="flex-shrink-0 size-4" />
                    <span>{isExtendedSidebarOpened ? "Hide" : "More"}</span>
                  </button>
                </SidebarNavItem>
              </>
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
    </>
  );
});
