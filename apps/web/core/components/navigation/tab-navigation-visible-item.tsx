/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { DefaultTabOutline, UnpinOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@makeplane/propel/components/context-menu";
import { TabNavigationItem } from "@plane/blocks/tab-navigation";
// local imports
import type { TNavigationItem } from "./tab-navigation-root";
import type { TTabPreferences } from "./tab-navigation-utils";

export type TTabNavigationVisibleItemProps = {
  item: TNavigationItem;
  isActive: boolean;
  tabPreferences: TTabPreferences;
  onToggleDefault: (tabKey: string) => void;
  onHide: (tabKey: string) => void;
  itemRef?: (el: HTMLDivElement | null) => void;
};

/**
 * Individual visible tab navigation item with context menu
 * Handles right-click actions for setting default and hiding tabs
 */
export function TabNavigationVisibleItem({
  item,
  isActive,
  tabPreferences,
  onToggleDefault,
  onHide,
  itemRef,
}: TTabNavigationVisibleItemProps) {
  const { t } = useTranslation();
  const isDefault = item.key === tabPreferences.defaultTab;

  return (
    <div className="relative flex h-full items-center transition-all duration-300">
      {isActive && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-[80%] -translate-x-1/2 rounded-t-md bg-(--text-color-icon-primary) transition-all duration-300" />
      )}
      <div key={`${item.key}-measure`} ref={itemRef}>
        <ContextMenu>
          <ContextMenuTrigger>
            <Link key={`${item.key}-${isActive ? "active" : "inactive"}`} to={item.href}>
              <TabNavigationItem isActive={isActive}>
                <span>{t(item.i18n_key)}</span>
              </TabNavigationItem>
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleDefault(item.key);
              }}
              icon={<DefaultTabOutline className="size-3 shrink-0" />}
              label={isDefault ? "Clear default" : "Set as default"}
            />
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onHide(item.key);
              }}
              icon={<UnpinOutline className="size-3 shrink-0" />}
              label="Hide in more menu"
            />
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}
