import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectViewIssuesHeader } from "./[viewId]/header";

export default function ProjectViewIssuesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, viewId } = params;

  return (
    <>
      <AppHeader
        header={<ProjectViewIssuesHeader workspaceSlug={workspaceSlug} projectId={projectId} viewId={viewId} />}
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
