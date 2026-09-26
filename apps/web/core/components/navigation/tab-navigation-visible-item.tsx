/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { DefaultTabOutline, UnpinOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@makeplane/propel/components/context-menu";
import { Icon } from "@makeplane/propel/components/icon";
// local imports
import type { TNavigationItem } from "./tab-navigation-root";
import type { TTabPreferences } from "./tab-navigation-utils";
import { UnderlineTabLink } from "./underline-tab-link";

export type TTabNavigationVisibleItemProps = {
  item: TNavigationItem;
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
  tabPreferences,
  onToggleDefault,
  onHide,
  itemRef,
}: TTabNavigationVisibleItemProps) {
  const { t } = useTranslation();
  const isDefault = item.key === tabPreferences.defaultTab;

  return (
    <div className="relative flex h-full items-center">
      <div key={`${item.key}-measure`} ref={itemRef}>
        <ContextMenu>
          {/* The active underline is Propel's `TabsIndicator`, drawn by the enclosing `TabsList`. */}
          <ContextMenuTrigger render={<div />}>
            <UnderlineTabLink value={item.key} label={t(item.i18n_key)} to={item.href} />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleDefault(item.key);
              }}
              icon={<Icon icon={DefaultTabOutline} />}
              label={isDefault ? "Clear default" : "Set as default"}
            />
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onHide(item.key);
              }}
              icon={<Icon icon={UnpinOutline} />}
              label="Hide in more menu"
            />
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}
