"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { PageHead } from "@/components/core";
import { useProject } from "@/hooks/store";
// plane web components
import { EpicsEmptyState } from "@/plane-web/components/epics";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const EpicsLayout = observer(({ children }: { children: ReactNode }) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  const { features, loader } = useProjectAdvanced();
  // derived values
  const project = getProjectById(projectId?.toString());
  const currentProjectDetails = features[projectId?.toString()];
  const isEpicsEnabled = currentProjectDetails?.is_epic_enabled;

  const pageTitle = project?.name ? `${project?.name} - Epics` : undefined;

  if (!isEpicsEnabled && !loader)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EpicsEmptyState
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          className="items-center"
          redirect
        />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      {children}
    </>
  );
});

export default EpicsLayout;
