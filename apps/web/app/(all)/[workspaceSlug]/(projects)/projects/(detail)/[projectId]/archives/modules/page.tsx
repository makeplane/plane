"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedModuleLayoutRoot, ArchivedModulesHeader } from "@/components/modules";
// hooks
import { useProject } from "@/hooks/store/use-project";

type ProjectArchivedModulesPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function ProjectArchivedModulesPage({ params }: ProjectArchivedModulesPageProps) {
  const { projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
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
}

export default observer(ProjectArchivedModulesPage);
