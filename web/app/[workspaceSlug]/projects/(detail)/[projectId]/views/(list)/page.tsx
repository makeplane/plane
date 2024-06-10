"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { ProjectViewsList } from "@/components/views";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useProject } from "@/hooks/store";

const ProjectViewsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Views` : undefined;

  if (!workspaceSlug || !projectId) return <></>;

  // No access to
  if (currentProjectDetails?.issue_views_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_VIEW}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
        />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectViewsList />
    </>
  );
});

export default ProjectViewsPage;
