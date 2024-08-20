"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { PagesListRoot, PagesListView } from "@/components/pages";
// hooks
import { useProject } from "@/hooks/store";

const ProjectPagesPage = observer(() => {
  // router
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
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
