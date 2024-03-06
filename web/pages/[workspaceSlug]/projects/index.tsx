import { ReactElement } from "react";
import { observer } from "mobx-react";
// components
import { PageHead } from "components/core";
import { ProjectsHeader } from "components/headers";
import { ProjectCardList } from "components/project";
// layouts
import { useWorkspace } from "hooks/store";
import { AppLayout } from "layouts/app-layout";
// type
import { NextPageWithLayout } from "lib/types";

const ProjectsPage: NextPageWithLayout = observer(() => {
  // store
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectCardList />
    </>
  );
});

ProjectsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<ProjectsHeader />}>{page}</AppLayout>;
};

export default ProjectsPage;
