/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";
import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { SettingsOutline } from "@makeplane/propel/icons";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@makeplane/propel/components/context-menu";
import { cn } from "@plane/utils";
// components
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
import { useAppRailVisibility } from "@/lib/app-rail/context";
// local imports
import { AppSidebarItemsRoot } from "./items-root";

export const AppRailRoot = observer(() => {
  const { t } = useTranslation();

  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // preferences
  const { preferences, updateDisplayMode } = useAppRailPreferences();
  const { isCollapsed, toggleAppRail } = useAppRailVisibility();
  // derived values
  const isWorkspaceSettingsPath = pathname.includes(`/${workspaceSlug}/settings`) && !projectId;
  const showLabel = preferences.displayMode === "icon_with_label";
  const railWidth = showLabel ? "3.75rem" : "3rem";

  return (
    <div
      className="z-[26] h-full flex-shrink-0 bg-canvas transition-all duration-300 ease-in-out"
      style={{
        width: railWidth,
        display: "block",
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger render={<div className="h-full" />}>
          <div className="flex h-full flex-col justify-between gap-4 px-2 py-3">
            <div
              className={cn("flex flex-col", {
                "gap-4": showLabel,
                "gap-3": !showLabel,
              })}
            >
              <AppSidebarItemsRoot showLabel={showLabel} />
              <div className="mx-2 border-t border-strong" />
              <AppSidebarItem
                item={{
                  label: t("settings"),
                  icon: <SettingsOutline className="size-5" />,
                  href: `/${workspaceSlug}/settings`,
                  isActive: isWorkspaceSettingsPath,
                  showLabel,
                }}
              />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => updateDisplayMode("icon_only")}
            label={t("web_ui.icon_only")}
            selected={preferences.displayMode === "icon_only"}
          />
          <ContextMenuItem
            onClick={() => updateDisplayMode("icon_with_label")}
            label={t("web_ui.icon_with_name")}
            selected={preferences.displayMode === "icon_with_label"}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={toggleAppRail}
            label={isCollapsed ? t("web_ui.dock_app_rail") : t("web_ui.undock_app_rail")}
          />
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
});
