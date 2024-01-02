import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { useProjectView } from "hooks/store";
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
import { NextPageWithLayout } from "lib/types";

const ProjectViewIssuesPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // store hooks
  const { fetchViewDetails } = useProjectView();

  const { error } = useSWR(
    workspaceSlug && projectId && viewId ? `VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && projectId && viewId
      ? () => fetchViewDetails(workspaceSlug.toString(), projectId.toString(), viewId.toString())
      : null
  );

  return (
    <>
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
    </>
  );
};

ProjectViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewIssuesPage;
