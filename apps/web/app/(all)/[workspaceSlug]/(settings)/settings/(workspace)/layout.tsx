/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { getWorkspaceActivePath, workspaceSettingsPathnameToAccessKey } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// plane web components
import { WorkspaceRightSidebar } from "@/components/workspace/right-sidebar";
// components
import { WorkspaceSettingsSidebarRoot } from "@/components/settings/workspace/sidebar";
// hooks
import { useWorkspaceSettingsAccess } from "@/hooks/permissions/use-workspace-settings-access";
// local imports
import type { Route } from "./+types/layout";

const WorkspaceSettingLayout = observer(function WorkspaceSettingLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { canAccessWorkspaceSettingByRoute } = useWorkspaceSettingsAccess();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { accessKey } = workspaceSettingsPathnameToAccessKey(pathname);
  const isAuthorized = canAccessWorkspaceSettingByRoute(workspaceSlug, accessKey);

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={(props) => <WorkspaceSettingsSidebarRoot {...props} workspaceSlug={workspaceSlug} />}
        activePath={getWorkspaceActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        {!isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" />
        ) : (
          <div className="relative flex size-full">
            <div className="h-full hidden md:block">
              <WorkspaceSettingsSidebarRoot workspaceSlug={workspaceSlug} />
            </div>
            <Outlet />
            <WorkspaceRightSidebar workspaceSlug={workspaceSlug} />
          </div>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;
