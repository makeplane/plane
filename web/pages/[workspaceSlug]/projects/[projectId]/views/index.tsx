import { ReactElement } from "react";
// components
import { ProjectViewsHeader } from "components/headers";
import { ProjectViewsList } from "components/views";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectViewsPage: NextPageWithLayout = () => <ProjectViewsList />;

ProjectViewsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewsPage;
