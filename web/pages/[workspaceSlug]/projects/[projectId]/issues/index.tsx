import { ReactElement } from "react";
// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
// layouts
import { AppLayout } from "layouts/app-layout";
import { IssuesMobileHeader } from "components/issues/issues-mobile-header";

const ProjectIssuesPage: NextPageWithLayout = () => (
  <div className="h-full w-full">
    <ProjectLayoutRoot />
  </div>
);

ProjectIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectIssuesHeader />} mobileHeader={<IssuesMobileHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectIssuesPage;
