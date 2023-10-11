import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { ProjectViewsHeader } from "components/headers";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// components
import { ProjectViewsList } from "components/views";
// types
import type { NextPage } from "next";

const ProjectViews: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { project: projectStore, projectViews: projectViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${projectId.toString()}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_LIST_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId
      ? () => projectViewsStore.fetchAllViews(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Views`} />
        </Breadcrumbs>
      }
      right={<ProjectViewsHeader />}
    >
      <ProjectViewsList />
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectViews;
