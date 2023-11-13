import { ReactElement } from "react";
import { useRouter } from "next/router";
// components
import { ProjectCardList } from "components/project";
import { ProjectsHeader } from "components/headers";
// layouts
import { AppLayout } from "layouts/app-layout";
// type
import { NextPageWithLayout } from "types/app";

const ProjectsPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return <>{workspaceSlug && <ProjectCardList workspaceSlug={workspaceSlug.toString()} />}</>;
};

ProjectsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<ProjectsHeader />}>{page}</AppLayout>;
};

export default ProjectsPage;
