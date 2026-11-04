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
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSubmenu,
  MenuSubmenuContent,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "@makeplane/propel/components/menu";
import { Icon } from "@makeplane/propel/components/icon";
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
 * Keeps direct navigation separate from each tab's preference actions.
 * User-hidden tabs can be shown; every tab can be set or cleared as the default.
 */
export function TabNavigationOverflowMenu({ overflowItems, isActive, tabPreferences, onToggleDefault, onShow }: Props) {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label={t("aria_labels.common.more_actions")}
            className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-layer-1"
          />
        }
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
            <React.Fragment key={`${item.key}-overflow-${itemIsActive ? "active" : "inactive"}`}>
              <MenuItem
                render={<Link to={item.href} />}
                label={t(item.i18n_key)}
                trailing={isDefault ? <Icon icon={DefaultTabOutline} size="sm" /> : undefined}
              />
              <MenuSubmenu>
                <MenuSubmenuTrigger label={`${t(item.i18n_key)} — ${t("aria_labels.common.more_actions")}`} />
                <MenuSubmenuContent>
                  {isHidden && (
                    <MenuItem icon={<Icon icon={PinOutline} />} label="Show" onClick={() => onShow(item.key)} />
                  )}
                  <MenuItem
                    icon={<Icon icon={DefaultTabOutline} />}
                    label={isDefault ? "Clear default" : "Set as default"}
                    onClick={() => onToggleDefault(item.key)}
                  />
                </MenuSubmenuContent>
              </MenuSubmenu>
            </React.Fragment>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
