import { Outlet } from "react-router";
import type { Route } from "../../../+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectViewsHeader } from "./header";
import { ViewMobileHeader } from "./mobile-header";

export default function ProjectViewsListLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader
        header={<ProjectViewsHeader workspaceSlug={workspaceSlug} projectId={projectId} />}
        mobileHeader={<ViewMobileHeader workspaceSlug={workspaceSlug} projectId={projectId} />}
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
