import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectViewLayoutRoot } from "components/issues";
import { ProjectViewIssuesHeader } from "components/headers";
// ui
import { EmptyState } from "components/common";
// assets
import emptyView from "public/empty-state/view.svg";
// types
import { NextPage } from "next";

const ProjectViewIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { projectViews: projectViewsStore } = useMobxStore();

  const { error } = useSWR(
    workspaceSlug && projectId && viewId ? `VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && projectId && viewId
      ? () => projectViewsStore.fetchViewDetails(workspaceSlug.toString(), projectId.toString(), viewId.toString())
      : null
  );

  return (
    <AppLayout header={<ProjectViewIssuesHeader />} withProjectWrapper>
      {error ? (
        <EmptyState
          image={emptyView}
          title="View does not exist"
          description="The view you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other views",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
          }}
        />
      ) : (
        <ProjectViewLayoutRoot />
      )}
    </AppLayout>
  );
};

export default ProjectViewIssues;
