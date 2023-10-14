import { useRouter } from "next/router";

import useSWR from "swr";

// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { ProjectService } from "services/project";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// helper
import { truncateText } from "helpers/string.helper";
// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";

// services
const projectService = new ProjectService();

const ProjectIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore, project: projectStore } = useMobxStore();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  // TODO: update the fetch keys
  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_USER_PROJECT_FILTERS" : null,
    workspaceSlug && projectId
      ? () => issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_STATES_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_LABELS_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_MEMBERS_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Issues`} />
        </Breadcrumbs>
      }
      right={<ProjectIssuesHeader />}
      bg="secondary"
    >
      <div className="h-full w-full flex flex-col">
        <ProjectLayoutRoot />
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectIssues;
