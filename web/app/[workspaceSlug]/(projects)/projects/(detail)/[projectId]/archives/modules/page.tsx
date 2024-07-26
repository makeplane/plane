"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ArchivedModuleLayoutRoot, ArchivedModulesHeader } from "@/components/modules";
// hooks
import { useProject } from "@/hooks/store";

const ProjectArchivedModulesPage = observer(() => {
  // router
  const { projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && `${project?.name} - Archived modules`;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedModulesHeader />
        <ArchivedModuleLayoutRoot />
      </div>
    </>
  );
});

export default ProjectArchivedModulesPage;
