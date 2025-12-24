import { Outlet } from "react-router";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace/content-wrapper";
import { AppRailVisibilityProvider } from "@/plane-web/hooks/app-rail";
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
