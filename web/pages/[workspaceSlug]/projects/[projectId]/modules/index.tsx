import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ModulesListView } from "components/modules";
import { ModulesListHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
import { ModulesListMobileHeader } from "components/modules/modules-list-mobile-header";

const ProjectModulesPage: NextPageWithLayout = () => <ModulesListView />;

ProjectModulesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectModulesPage;
