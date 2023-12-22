import { ReactElement } from "react";
// components
import { ProjectCardList } from "components/project";
import { ProjectsHeader } from "components/headers";
// layouts
import { AppLayout } from "layouts/app-layout";
// type
import { NextPageWithLayout } from "types/app";

const ProjectsPage: NextPageWithLayout = () => <ProjectCardList />;

ProjectsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<ProjectsHeader />}>{page}</AppLayout>;
};

export default ProjectsPage;
