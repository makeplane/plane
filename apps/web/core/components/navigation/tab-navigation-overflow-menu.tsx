import React from "react";
import { Link } from "react-router";
import { MoreHorizontal, Star, Pin } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Menu } from "@plane/propel/menu";
import { TabNavigationItem } from "@plane/propel/tab-navigation";
import { cn } from "@plane/utils";
import type { TNavigationItem } from "./tab-navigation-root";
import type { TTabPreferences } from "./tab-navigation-utils";

export type TTabNavigationOverflowMenuProps = {
  overflowItems: TNavigationItem[];
  isActive: (item: TNavigationItem) => boolean;
  tabPreferences: TTabPreferences;
  onToggleDefault: (tabKey: string) => void;
  onShow: (tabKey: string) => void;
};

/**
 * Overflow menu for tab navigation items
 * Displays items that don't fit in the visible area, with action icons
 * Shows "Eye" icon for user-hidden items, "Star" icon for all items
 */
export const TabNavigationOverflowMenu: React.FC<TTabNavigationOverflowMenuProps> = ({
  overflowItems,
  isActive,
  tabPreferences,
  onToggleDefault,
  onShow,
}) => {
  const { t } = useTranslation();

  return (
    <Menu
      ellipsis
      buttonClassName="!p-1.5"
      optionsClassName="min-w-[200px] space-y-1"
      customButton={
        <div className="flex items-center justify-center rounded-md p-1 hover:bg-custom-background-80 transition-colors">
          <MoreHorizontal className="h-4 w-4 text-custom-text-200" />
        </div>
      }
    >
      {overflowItems.map((item) => {
        const itemIsActive = isActive(item);
        // isHidden = true only for user-hidden items (not space-constrained overflow)
        const isHidden = tabPreferences.hiddenTabs.includes(item.key);
        const isDefault = item.key === tabPreferences.defaultTab;

        return (
          <Menu.MenuItem
            key={`${item.key}-overflow-${itemIsActive ? "active" : "inactive"}`}
            className={cn("p-0 w-full", {
              "bg-custom-background-80": itemIsActive,
            })}
          >
            <div className="flex items-center justify-between w-full group">
              <Link to={item.href} className="flex-1 min-w-0 w-full">
                <TabNavigationItem isActive={itemIsActive}>
                  <span className="text-sm">{t(item.i18n_key)}</span>
                </TabNavigationItem>
              </Link>
              <div
                className={cn("flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity", {
                  "opacity-100": itemIsActive,
                })}
              >
                {/* Show Eye icon ONLY for user-hidden items */}
                {isHidden && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onShow(item.key);
                    }}
                    className="p-1 rounded hover:bg-custom-background-90"
                    title="Show"
                  >
                    <Pin className="h-3.5 w-3.5 text-custom-text-300 rotate-45" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleDefault(item.key);
                  }}
                  className="p-1 rounded hover:bg-custom-background-90"
                  title={isDefault ? "Clear default" : "Set as default"}
                >
                  <Star className={`h-3.5 w-3.5 text-custom-text-300 ${isDefault ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </Menu.MenuItem>
        );
      })}
    </Menu>
  );
};
