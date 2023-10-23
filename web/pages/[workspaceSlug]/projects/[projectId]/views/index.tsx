import React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectViewsHeader } from "components/headers";
import { ProjectViewsList } from "components/views";
// layouts
import { AppLayout } from "layouts/app-layout";

const ProjectViews: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectViews: projectViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_LIST_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId
      ? () => projectViewsStore.fetchAllViews(workspaceSlug.toString(), projectId.toString())
      : null
  );

  return (
    <AppLayout header={<ProjectViewsHeader />} withProjectWrapper>
      <ProjectViewsList />
    </AppLayout>
  );
};

export default ProjectViews;
