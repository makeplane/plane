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
import { getProjectActivePath, projectSettingsPathnameToAccessKey } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
import { ProjectSettingsSidebarRoot } from "@/components/settings/project/sidebar";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane web imports
import { ProjectRightSidebar } from "@/components/projects/settings/right-sidebar";
// hooks
import { useProjectSettingsAccess } from "@/hooks/permissions/use-project-settings-access";
// types
import type { Route } from "./+types/layout";

const ProjectDetailSettingsLayout = observer(function ProjectDetailSettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const pathname = usePathname();
  // store hooks
  const { canAccessProjectSettingByAccessKey } = useProjectSettingsAccess();
  // derived values
  const accessKey = projectSettingsPathnameToAccessKey(pathname);
  const isAuthorized = canAccessProjectSettingByAccessKey(workspaceSlug, projectId, accessKey);

  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      <SettingsMobileNav
        hamburgerContent={(props) => (
          <ProjectSettingsSidebarRoot {...props} workspaceSlug={workspaceSlug} projectId={projectId} />
        )}
        activePath={getProjectActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        {!isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" isProjectView />
        ) : (
          <div className="relative flex size-full">
            <div className="shrink-0 h-full hidden md:block">
              <ProjectSettingsSidebarRoot workspaceSlug={workspaceSlug} projectId={projectId} />
            </div>
            <Outlet />
            <ProjectRightSidebar workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        )}
      </div>
    </ProjectAuthWrapper>
  );
});

export default ProjectDetailSettingsLayout;
