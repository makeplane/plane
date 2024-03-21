import { ReactElement } from "react";
import { observer } from "mobx-react";
import Head from "next/head";
import { useRouter } from "next/router";
// components
import { PageHead } from "@/components/core";
import { ProjectIssuesHeader } from "@/components/headers";
import { ProjectLayoutRoot } from "@/components/issues";
// types
import { IssuesMobileHeader } from "@/components/issues/issues-mobile-header";
import { useProject } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { NextPageWithLayout } from "@/lib/types";
// layouts
// hooks

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
    <AppLayout header={<ProjectIssuesHeader />} mobileHeader={<IssuesMobileHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectIssuesPage;
