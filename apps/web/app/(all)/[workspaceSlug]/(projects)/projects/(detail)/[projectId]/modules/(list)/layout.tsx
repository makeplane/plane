import { Outlet } from "react-router";
import type { Route } from "../../../+types/layout";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ModulesListHeader } from "./header";
import { ModulesListMobileHeader } from "./mobile-header";

export default function ProjectModulesListLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader
        header={<ModulesListHeader workspaceSlug={workspaceSlug} projectId={projectId} />}
        mobileHeader={<ModulesListMobileHeader workspaceSlug={workspaceSlug} projectId={projectId} />}
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
