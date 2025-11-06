"use client";

import { observer } from "mobx-react";
import { Outlet } from "react-router";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// plane web components
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { ProjectAppSidebar } from "./_sidebar";

function WorkspaceLayout() {
  return (
    <AuthenticationWrapper>
      <ProjectsAppPowerKProvider />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div id="full-screen-portal" className="inset-0 absolute w-full" />
          <div className="relative flex size-full overflow-hidden">
            <ProjectAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              <Outlet />
            </main>
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}

export default observer(WorkspaceLayout);
