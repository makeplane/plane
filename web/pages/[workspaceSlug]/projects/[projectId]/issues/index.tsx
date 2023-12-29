import { ReactElement } from "react";
// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
// layouts
import { AppLayout } from "layouts/app-layout";

const ProjectIssuesPage: NextPageWithLayout = () => (
  <div className="h-full w-full">
    <ProjectLayoutRoot />
  </div>
);

ProjectIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectIssuesPage;
