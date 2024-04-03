import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// components
import { PageHead } from "@/components/core";
import { ArchivedCycleLayoutRoot, ArchivedCyclesHeader } from "@/components/cycles";
import { ProjectArchivesHeader } from "@/components/headers";
// hooks
import { useProject } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectArchivedCyclesPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { projectId } = router.query;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && `${project?.name} - Archived cycles`;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedCyclesHeader />
        <ArchivedCycleLayoutRoot />
      </div>
    </>
  );
});

ProjectArchivedCyclesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectArchivesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectArchivedCyclesPage;
