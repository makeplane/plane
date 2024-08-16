"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { PagesListRoot, PagesListView } from "@/components/pages";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useProject } from "@/hooks/store";

const ProjectPagesPage = observer(() => {
  // router
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById, currentProjectDetails } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Pages` : undefined;

  const currentPageType = (): TPageNavigationTabs => {
    const pageType = type?.toString();
    if (pageType === "private") return "private";
    if (pageType === "archived") return "archived";
    return "public";
  };

  if (!workspaceSlug || !projectId) return <></>;

  // No access to cycle
  if (currentProjectDetails?.page_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_PAGE}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
        />
      </div>
    );
  return (
    <>
      <PageHead title={pageTitle} />
      <PagesListView
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        pageType={currentPageType()}
      >
        <PagesListRoot
          pageType={currentPageType()}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      </PagesListView>
    </>
  );
});

export default ProjectPagesPage;
