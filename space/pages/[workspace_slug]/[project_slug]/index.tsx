import Head from "next/head";
import { useRouter } from "next/router";

import useSWR from "swr";

/// layouts
import ProjectLayout from "layouts/project-layout";
// components
import { ProjectDetailsView } from "components/views/project-details";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

const WorkspaceProjectPage = (props: any) => {
  const SITE_TITLE = props?.project_settings?.project_details?.name || "Plane | Deploy";

  const router = useRouter();
  const { workspace_slug, project_slug, states, labels, priorities } = router.query;

  const { project: projectStore, issue: issueStore } = useMobxStore();

  useSWR("REVALIDATE_ALL", () => {
    if (workspace_slug && project_slug) {
      projectStore.fetchProjectSettings(workspace_slug.toString(), project_slug.toString());
      const params = {
        state: states || null,
        labels: labels || null,
        priority: priorities || null,
      };
      issueStore.fetchPublicIssues(workspace_slug.toString(), project_slug.toString(), params);
    }
  });

  return (
    <ProjectLayout>
      <Head>
        <title>{SITE_TITLE}</title>
      </Head>
      <ProjectDetailsView />
    </ProjectLayout>
  );
};

export default WorkspaceProjectPage;
