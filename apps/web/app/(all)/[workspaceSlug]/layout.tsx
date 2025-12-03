import { Outlet } from "react-router";
import { AppRailVisibilityProvider } from "@/lib/app-rail";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace/content-wrapper";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function WorkspaceLayout() {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <AppRailVisibilityProvider>
          <WorkspaceContentWrapper>
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailVisibilityProvider>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
