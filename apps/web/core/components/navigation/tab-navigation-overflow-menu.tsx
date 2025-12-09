import React from "react";
import { Link } from "react-router";
import { MoreHorizontal, Pin } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { SetAsDefaultIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import { Tooltip } from "@plane/propel/tooltip";
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
    <Menu
      ellipsis
      buttonClassName="!p-1.5"
      optionsClassName="min-w-[200px] space-y-1"
      customButton={
        <div className="flex items-center justify-center rounded-md p-1 hover:bg-layer-1 transition-colors">
          <MoreHorizontal className="h-4 w-4 text-secondary" />
        </div>
      }
    >
      {overflowItems.map((item) => {
        const itemIsActive = isActive(item);
        // isHidden = true only for user-hidden items (not space-constrained overflow)
        const isHidden = tabPreferences.hiddenTabs.includes(item.key);
        const isDefault = item.key === tabPreferences.defaultTab;

        return (
          <Menu.MenuItem key={`${item.key}-overflow-${itemIsActive ? "active" : "inactive"}`} className="p-0 w-full">
            <div className="flex items-center justify-between w-full group/menu-item">
              <Link to={item.href} className="flex-1 min-w-0 w-full p-1">
                <span className="text-11">{t(item.i18n_key)}</span>
              </Link>
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
                    className="invisible group-hover/menu-item:visible p-1 rounded-sm text-tertiary hover:text-primary transition-colors"
                    title="Show"
                  >
                    <Pin className="size-3" />
                  </button>
                )}
                <Tooltip tooltipContent={isDefault ? "Clear default" : "Set as default"}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleDefault(item.key);
                    }}
                    className={cn(
                      "invisible group-hover/menu-item:visible p-1 rounded-sm text-tertiary hover:text-primary transition-colors",
                      {
                        visible: isDefault,
                      }
                    )}
                    title={isDefault ? "Clear default" : "Set as default"}
                  >
                    <SetAsDefaultIcon className="size-3" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </Menu.MenuItem>
        );
      })}
    </Menu>
  );
}
