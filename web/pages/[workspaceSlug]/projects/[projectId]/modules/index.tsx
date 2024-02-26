import { ReactElement } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageHead } from "components/core";
import { ModulesListView } from "components/modules";
import { ModulesListHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
// hooks
import { useProject } from "hooks/store";
import { observer } from "mobx-react";

const ProjectModulesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { projectId } = router.query;
  // store
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Modules` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <ModulesListView />
    </>
  );
});

ProjectModulesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ModulesListHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectModulesPage;
