"use client";
import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Settings } from "lucide-react";
// components
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
// hooks
import { useAppRail } from "@/hooks/use-app-rail";
import { useWorkspacePaths } from "@/hooks/use-workspace-paths";
// local imports
import { WithFeatureFlagHOC } from "../feature-flags";

import { AppSidebarItemsRoot } from "./items-root";

export const AppRailRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { shouldRenderAppRail } = useAppRail();

  const { isSettingsPath } = useWorkspacePaths();

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="APP_RAIL" fallback={<></>}>
      <div
        className="h-full flex-shrink-0 py-2 transition-all ease-in-out duration-300 z-[26]"
        style={{
          width: shouldRenderAppRail ? "3.75rem" : "0",
          display: shouldRenderAppRail ? "block" : "none",
        }}
      >
        <div className="flex flex-col justify-between gap-4 px-2 py-4 h-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center mb-3">
              <WorkspaceMenuRoot renderLogoOnly />
            </div>
            <AppSidebarItemsRoot />
          </div>
          <div className="flex flex-col items-center gap-4">
            <AppSidebarItem
              item={{
                icon: <Settings className="size-5" />,
                href: `/${workspaceSlug}/settings`,
                isActive: isSettingsPath,
              }}
            />
            <HelpMenuRoot />
            <div className="flex items-center justify-center size-8">
              <UserMenuRoot size="md" />
            </div>
          </div>
        </div>
      </div>
    </WithFeatureFlagHOC>
  );
});
