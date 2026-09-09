/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Link } from "react-router";
import { DefaultTabOutline, MoreHorizontalOutline, PinOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// local imports
import type { TNavigationItem } from "./tab-navigation-root";
import type { TTabPreferences } from "./tab-navigation-utils";

type Props = {
  overflowItems: TNavigationItem[];
  isActive: (item: TNavigationItem) => boolean;
  tabPreferences: TTabPreferences;
  onToggleDefault: (tabKey: string) => void;
  onShow: (tabKey: string) => void;
};

/**
 * Overflow menu for tab navigation items
 * Displays items that don't fit in the visible area, with action icons
 * Shows "Eye" icon for user-hidden items, "Set as default" icon for all items
 */
export function TabNavigationOverflowMenu({ overflowItems, isActive, tabPreferences, onToggleDefault, onShow }: Props) {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuTrigger
        render={<div className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-layer-1" />}
      >
        <MoreHorizontalOutline className="h-4 w-4 text-secondary" />
      </MenuTrigger>
      <MenuContent>
        {overflowItems.map((item) => {
          const itemIsActive = isActive(item);
          // isHidden = true only for user-hidden items (not space-constrained overflow)
          const isHidden = tabPreferences.hiddenTabs.includes(item.key);
          const isDefault = item.key === tabPreferences.defaultTab;

          return (
            <MenuItem
              key={`${item.key}-overflow-${itemIsActive ? "active" : "inactive"}`}
              render={<Link to={item.href} className="group/menu-item" />}
              label={t(item.i18n_key)}
              trailing={
                <div className="flex items-center">
                  {/* Show Eye icon ONLY for user-hidden items */}
                  {isHidden && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onShow(item.key);
                      }}
                      className="invisible rounded-sm p-1 text-tertiary transition-colors group-hover/menu-item:visible hover:text-primary"
                      title="Show"
                    >
                      <PinOutline className="size-3" />
                    </button>
                  )}
                  <Tooltip label={isDefault ? "Clear default" : "Set as default"}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onToggleDefault(item.key);
                      }}
                      className={cn(
                        "invisible rounded-sm p-1 text-tertiary transition-colors group-hover/menu-item:visible hover:text-primary",
                        {
                          visible: isDefault,
                        }
                      )}
                      title={isDefault ? "Clear default" : "Set as default"}
                    >
                      <DefaultTabOutline className="size-3" />
                    </button>
                  </Tooltip>
                </div>
              }
            />
          );
        })}
      </MenuContent>
    </Menu>
  );
}
