import { ReactElement } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
// layouts
import { AppLayout } from "layouts/app-layout";
// hooks
import { useProject } from "hooks/store";
import { PageHead } from "components/core";

const ProjectIssuesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { projectId } = router.query;
  // store
  const { getProjectById } = useProject();

  if (!projectId) {
    return <></>;
  }

  // derived values
  const project = getProjectById(projectId.toString());
  const pageTitle = project?.name ? `${project?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <Head>
        <title>{project?.name} - Issues</title>
      </Head>
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
});

ProjectIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectIssuesPage;
