/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { Ellipsis } from "lucide-react";
import { Transition } from "@headlessui/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import {
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
// store hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import useLocalStorage from "@/hooks/use-local-storage";
import {
  usePersonalNavigationPreferences,
  useWorkspaceNavigationPreferences,
} from "@/hooks/use-navigation-preferences";
// local components
import { SidebarItem } from "./sidebar-item";

export const SidebarMenuItems = observer(function SidebarMenuItems() {
  // routers
  const { setValue: toggleWorkspaceMenu, storedValue: isWorkspaceMenuOpen } = useLocalStorage<boolean>(
    "is_workspace_menu_open",
    true
  );

  // store hooks
  const { isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();
  // hooks
  const { preferences: personalPreferences } = usePersonalNavigationPreferences();
  const { preferences: workspacePreferences } = useWorkspaceNavigationPreferences();
  // translation
  const { t } = useTranslation();

  const toggleListDisclosure = (isOpen: boolean) => {
    toggleWorkspaceMenu(isOpen);
  };

  // Filter static navigation items based on personal preferences
  const filteredStaticNavigationItems = useMemo(() => {
    const items = [...WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS];
    const personalItems: Array<(typeof items)[0] & { sort_order: number }> = [];

    // Add personal items based on preferences with their sort_order
    const stickiesItem = WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["stickies"];
    if (personalPreferences.items.stickies?.enabled && stickiesItem) {
      personalItems.push({
        ...stickiesItem,
        sort_order: personalPreferences.items.stickies.sort_order,
      });
    }
    if (personalPreferences.items.your_work?.enabled && WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["your-work"]) {
      personalItems.push({
        ...WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["your-work"],
        sort_order: personalPreferences.items.your_work.sort_order,
      });
    }
    if (personalPreferences.items.drafts?.enabled && WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["drafts"]) {
      personalItems.push({
        ...WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["drafts"],
        sort_order: personalPreferences.items.drafts.sort_order,
      });
    }

    // Sort personal items by sort_order
    personalItems.sort((a, b) => a.sort_order - b.sort_order);

    // Merge static items with sorted personal items
    return [...items, ...personalItems];
  }, [personalPreferences]);

  const sortedNavigationItems = useMemo(
    () =>
      WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.map((item) => {
        const preference = workspacePreferences.items[item.key];
        return {
          ...item,
          sort_order: preference ? preference.sort_order : 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order),
    [workspacePreferences]
  );

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {filteredStaticNavigationItems.map((item, _index) => (
          <SidebarItem key={`static_${_index}`} item={item} />
        ))}
      </div>
      <Collapsible className="flex flex-col" open={!!isWorkspaceMenuOpen} onOpenChange={toggleListDisclosure}>
        <div className="group w-full flex items-center justify-between px-1.5  py-2 rounded-sm text-placeholder hover:bg-layer-transparent-hover">
          <CollapsibleTrigger
            type="button"
            className="w-full flex items-center gap-1 whitespace-nowrap text-left text-13 font-semibold text-placeholder"
            onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
            aria-label={t(
              isWorkspaceMenuOpen
                ? "aria_labels.app_sidebar.close_workspace_menu"
                : "aria_labels.app_sidebar.open_workspace_menu"
            )}
          >
            <span className="text-13 font-semibold">{t("common.workspace")}</span>
          </CollapsibleTrigger>
          <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
            <CollapsibleTrigger
              type="button"
              className="p-0.5 rounded-sm hover:bg-layer-1 flex-shrink-0"
              onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
              aria-label={t(
                isWorkspaceMenuOpen
                  ? "aria_labels.app_sidebar.close_workspace_menu"
                  : "aria_labels.app_sidebar.open_workspace_menu"
              )}
            >
              <ChevronRightIcon
                className={cn("flex-shrink-0 size-3 transition-all", {
                  "rotate-90": isWorkspaceMenuOpen,
                })}
              />
            </CollapsibleTrigger>
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
            <CollapsibleContent className="flex flex-col gap-0.5">
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
                    className="flex items-center gap-1.5 text-13 font-medium flex-grow text-tertiary"
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
            </CollapsibleContent>
          )}
        </Transition>
      </Collapsible>
    </>
  );
});
