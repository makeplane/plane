import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ModulesListView } from "components/modules";
import { ModulesListHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";

const ProjectModulesPage: NextPageWithLayout = () => <ModulesListView />;

ProjectModulesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ModulesListHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectModulesPage;
