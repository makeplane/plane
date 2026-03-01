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
import { getProjectActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
import { ProjectSettingsSidebarRoot } from "@/components/settings/project/sidebar";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane web imports
import { ProjectRightSidebar } from "@/components/projects/settings/right-sidebar";
// types
import type { Route } from "./+types/layout";

const ProjectDetailSettingsLayout = observer(function ProjectDetailSettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const pathname = usePathname();

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={(props) => <ProjectSettingsSidebarRoot {...props} projectId={projectId} />}
        activePath={getProjectActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        <div className="relative flex size-full">
          <div className="shrink-0 h-full hidden md:block">
            <ProjectSettingsSidebarRoot projectId={projectId} />
          </div>
          <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
            <Outlet />
            <ProjectRightSidebar workspaceSlug={workspaceSlug} projectId={projectId} />
          </ProjectAuthWrapper>
        </div>
      </div>
    </>
  );
});

export default ProjectDetailSettingsLayout;
