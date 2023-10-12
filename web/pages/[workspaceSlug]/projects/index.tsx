import { useRouter } from "next/router";
import type { NextPage } from "next";
// components
import { ProjectCardList } from "components/project";
import { ProjectsHeader } from "components/headers";
// layouts
import { AppLayout } from "layouts/app-layout";

const ProjectsPage: NextPage = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <AppLayout header={<ProjectsHeader />}>
      <>{workspaceSlug && <ProjectCardList workspaceSlug={workspaceSlug.toString()} />}</>
    </AppLayout>
  );
};

export default ProjectsPage;
