import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { ProjectDetailsView } from "@/components/views";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useMobxStore } from "@/hooks/store";
// layouts
import ProjectLayout from "@/layouts/project-layout";
// wrappers
import { AuthWrapper } from "@/lib/wrappers";

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
    <AuthWrapper pageType={EPageTypes.AUTHENTICATED}>
      <ProjectLayout>
        <Head>
          <title>{SITE_TITLE}</title>
        </Head>
        <ProjectDetailsView />
      </ProjectLayout>
    </AuthWrapper>
  );
};

export default WorkspaceProjectPage;
