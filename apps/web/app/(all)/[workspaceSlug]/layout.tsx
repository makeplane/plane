import { Outlet } from "react-router";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace/content-wrapper";
import { AppRailVisibilityProvider } from "@/plane-web/hooks/app-rail";
import { GlobalModals } from "@/plane-web/components/common/modal/global";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import type { Route } from "./+types/layout";

export default function WorkspaceLayout(props: Route.ComponentProps) {
  const { workspaceSlug } = props.params;

  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <AppRailVisibilityProvider>
          <WorkspaceContentWrapper>
            <GlobalModals workspaceSlug={workspaceSlug} />
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailVisibilityProvider>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
