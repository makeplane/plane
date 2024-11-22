"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { useQueryParams } from "@/hooks/use-query-params";

const ProjectPagesPage = observer(() => {
  // router
  const router = useRouter();
  // params
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  // store hooks
  const { getProjectById, currentProjectDetails } = useProject();
  const { updateQueryParams } = useQueryParams();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Pages` : undefined;

  const currentPageType = (): TPageNavigationTabs => {
    const pageType = type?.toString();
    if (pageType === "private") return "private";
    if (pageType === "trash") return "trash";
    return "public";
  };
  // update the route to public pages if the type is invalid
  useEffect(() => {
    const pageType = type?.toString();
    if (pageType !== "public" && pageType !== "private" && pageType !== "trash") {
      const updatedRoute = updateQueryParams({
        paramsToAdd: {
          type: "public",
        },
      });
      router.push(updatedRoute);
    }
  }, [router, type, updateQueryParams]);

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
