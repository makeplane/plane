"use client";

import { observer } from "mobx-react";
import type { Route } from "./+types/page";
import useSWR from "swr";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { ProjectViewLayoutRoot } from "@/components/issues/issue-layouts/roots/project-view-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectView } from "@/hooks/store/use-project-view";
// assets
import { useAppRouter } from "@/hooks/use-app-router";
import emptyView from "@/app/assets/empty-state/view.svg";

const ProjectViewIssuesPage: React.FC<Route.ComponentProps> = observer(({ params }) => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, viewId } = params;
  // store hooks
  const { fetchViewDetails, getViewById } = useProjectView();
  const { getProjectById } = useProject();
  // derived values
  const projectView = viewId ? getViewById(viewId.toString()) : undefined;
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && projectView?.name ? `${project?.name} - ${projectView?.name}` : undefined;

  const { error } = useSWR(
    workspaceSlug && projectId && viewId ? `VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && projectId && viewId
      ? () => fetchViewDetails(workspaceSlug.toString(), projectId.toString(), viewId.toString())
      : null
  );

  if (error) {
    return (
      <EmptyState
        image={emptyView}
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        primaryButton={{
          text: "View other views",
          onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
        }}
      />
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectViewLayoutRoot />
    </>
  );
});

export default ProjectViewIssuesPage;
