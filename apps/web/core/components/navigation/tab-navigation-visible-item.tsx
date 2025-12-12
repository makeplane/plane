import { Link } from "react-router";
import { PinOff } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContextMenu } from "@plane/propel/context-menu";
import { SetAsDefaultIcon } from "@plane/propel/icons";
import { TabNavigationItem } from "@plane/propel/tab-navigation";
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
    <div className="relative h-full flex items-center transition-all duration-300">
      {isActive && (
        <span className="absolute bottom-0 w-[80%] left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
      )}
      <div key={`${item.key}-measure`} ref={itemRef}>
        <ContextMenu>
          <ContextMenu.Trigger>
            <Link key={`${item.key}-${isActive ? "active" : "inactive"}`} to={item.href}>
              <TabNavigationItem isActive={isActive}>
                <span>{t(item.i18n_key)}</span>
              </TabNavigationItem>
            </Link>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content positionerClassName="z-30">
              <ContextMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDefault(item.key);
                }}
                className="flex items-center gap-2 text-secondary transition-colors cursor-pointer"
              >
                <SetAsDefaultIcon className="shrink-0 size-3" />
                <span className="text-11">{isDefault ? "Clear default" : "Set as default"}</span>
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  onHide(item.key);
                }}
                className="flex items-center gap-2 text-secondary transition-colors cursor-pointer"
              >
                <PinOff className="shrink-0 size-3" />
                <span className="text-11">Hide in more menu</span>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu>
      </div>
    </div>
  );
}
