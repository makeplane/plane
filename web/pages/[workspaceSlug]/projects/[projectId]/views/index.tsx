import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { ProjectViewsHeader } from "@/components/headers";
import { ProjectViewsList } from "@/components/views";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useProject } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectViewsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
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

ProjectViewsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewsPage;
