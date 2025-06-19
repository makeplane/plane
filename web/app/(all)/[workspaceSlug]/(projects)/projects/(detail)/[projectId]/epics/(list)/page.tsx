"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { ProjectEpicsLayoutRoot } from "@/plane-web/components/issues";

const ProjectEpicsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Epics` : undefined;
  if (!workspaceSlug || !projectId) return <></>;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full">
        <div className="h-full w-full overflow-hidden">
          <ProjectEpicsLayoutRoot />
        </div>
      </div>
    </>
  );
});

export default ProjectEpicsPage;
