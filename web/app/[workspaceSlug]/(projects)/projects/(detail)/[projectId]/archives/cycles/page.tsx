"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ArchivedCycleLayoutRoot, ArchivedCyclesHeader } from "@/components/cycles";
// hooks
import { useProject } from "@/hooks/store";

const ProjectArchivedCyclesPage = observer(() => {
  // router
  const { projectId } = useParams();
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

export default ProjectArchivedCyclesPage;