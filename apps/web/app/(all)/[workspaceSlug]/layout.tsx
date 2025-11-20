"use client";

import { Outlet } from "react-router";
import { AppRailProvider } from "@/hooks/context/app-rail-context";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace/content-wrapper";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function WorkspaceLayout() {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <AppRailProvider>
          <WorkspaceContentWrapper>
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailProvider>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
