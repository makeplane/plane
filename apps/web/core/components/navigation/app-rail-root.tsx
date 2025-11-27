"use client";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Check, SettingsIcon } from "lucide-react";
import { ContextMenu } from "@plane/propel/context-menu";
import { cn } from "@plane/utils";
// components
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
// local imports
import { AppSidebarItemsRoot } from "./items-root";

export const AppRailRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // preferences
  const { preferences, updateDisplayMode } = useAppRailPreferences();

  const isSettingsPath = pathname.includes(`/${workspaceSlug}/settings`);
  const showLabel = preferences.displayMode === "icon_with_label";
  const railWidth = showLabel ? "3.75rem" : "3rem";

  return (
    <div
      className="h-full flex-shrink-0 transition-all ease-in-out duration-300 z-[26]"
      style={{
        width: railWidth,
        display: "block",
      }}
    >
      <ContextMenu>
        <ContextMenu.Trigger className="h-full">
          <div className="flex flex-col justify-between gap-4 px-2 py-3 h-full">
            <div
              className={cn("flex flex-col", {
                "gap-4": showLabel,
                "gap-3": !showLabel,
              })}
            >
              <AppSidebarItemsRoot showLabel={showLabel} />
              <div className="border-t border-custom-sidebar-border-300 mx-2" />
              <AppSidebarItem
                item={{
                  label: "Settings",
                  icon: <SettingsIcon className="size-4" />,
                  href: `/${workspaceSlug}/settings`,
                  isActive: isSettingsPath,
                  showLabel,
                }}
              />
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content positionerClassName="z-30" className="outline-none">
            <ContextMenu.Item onClick={() => updateDisplayMode("icon_only")}>
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs">Icon only</span>
                {preferences.displayMode === "icon_only" && <Check className="size-3.5" />}
              </div>
            </ContextMenu.Item>
            <ContextMenu.Item onClick={() => updateDisplayMode("icon_with_label")}>
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs">Icon with name</span>
                {preferences.displayMode === "icon_with_label" && <Check className="size-3.5" />}
              </div>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    </div>
  );
});
