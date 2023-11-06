import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectViewsHeader } from "components/headers";
import { ProjectViewsList } from "components/views";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "types/app";

const ProjectViewsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    projectViews: { fetchAllViews },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_LIST_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId ? () => fetchAllViews(workspaceSlug.toString(), projectId.toString()) : null
  );

  return <ProjectViewsList />;
};

ProjectViewsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewsPage;
