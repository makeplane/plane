import { useRouter } from "next/router";
import useSWR from "swr";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// types
import type { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout";

const ProjectIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore } = useMobxStore();

  // TODO: update the fetch keys
  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_USER_PROJECT_FILTERS" : null,
    workspaceSlug && projectId
      ? () => issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString())
      : null
  );

  return (
    <AppLayout header={<ProjectIssuesHeader />} withProjectWrapper>
      <div className="h-full w-full flex flex-col">
        <ProjectLayoutRoot />
      </div>
    </AppLayout>
  );
};

export default ProjectIssues;
