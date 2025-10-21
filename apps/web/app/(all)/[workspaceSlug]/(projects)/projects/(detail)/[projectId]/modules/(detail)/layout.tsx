import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ModuleIssuesHeader } from "./header";
import { ModuleIssuesMobileHeader } from "./mobile-header";

export default function ProjectModuleIssuesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, moduleId } = params;

  return (
    <>
      <AppHeader
        header={<ModuleIssuesHeader workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} />}
        mobileHeader={
          <ModuleIssuesMobileHeader workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} />
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
