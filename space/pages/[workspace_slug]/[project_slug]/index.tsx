import useSWR from "swr";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
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

// export const getServerSideProps: GetServerSideProps<any> = async ({ query: { workspace_slug, project_slug } }) => {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/workspaces/${workspace_slug}/project-boards/${project_slug}/settings/`
//   );
//   const project_settings = await res.json();
//   return { props: { project_settings } };
// };

export default WorkspaceProjectPage;
