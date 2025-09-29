"use client";

// layouts
import { useParams } from "next/navigation";
// components
import { EUserPermissions } from "@plane/constants";
// wrappers
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
// plane web components
// import { PagesAppCommandPalette } from "@/plane-web/components/command-palette";
// import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WorkspacePagesUpgrade } from "@/plane-web/components/pages";
// plane web layouts
// local components
// import { FloatingActionsRoot } from "../../(projects)/floating-action-bar";
import { PagesAppSidebar } from "./sidebar";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";

export default function WorkspacePagesLayout({ children }: { children: React.ReactNode }) {
  // router
  const { workspaceSlug } = useParams();
  const workspaceSlugStr = Array.isArray(workspaceSlug) ? workspaceSlug[0] : workspaceSlug;

  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        {/* <WithFeatureFlagHOC
          workspaceSlug={workspaceSlugStr}
          flag="WORKSPACE_PAGES"
          fallback={<WorkspacePagesUpgrade />}
        > */}
        <WorkspaceAccessWrapper pageKey="pages" allowedPermissions={[EUserPermissions.ADMIN, EUserPermissions.MEMBER]}>
          {/* <PagesAppCommandPalette /> */}
          <div className="relative flex h-full w-full overflow-hidden">
            <PagesAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {children}
            </main>
            {/* <FloatingActionsRoot> */}
            {/* <StickyActionBar / */}
            {/* </FloatingActionsRoot> */}
          </div>
        </WorkspaceAccessWrapper>
        {/* </WithFeatureFlagHOC> */}
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
