"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedCycleLayoutRoot } from "@/components/cycles/archived-cycles";
import { ArchivedCyclesHeader } from "@/components/cycles/archived-cycles/header";
// hooks
import { useProject } from "@/hooks/store/use-project";

type ProjectArchivedCyclesPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function ProjectArchivedCyclesPage({ params }: ProjectArchivedCyclesPageProps) {
  const { projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
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
}

export default observer(ProjectArchivedCyclesPage);
