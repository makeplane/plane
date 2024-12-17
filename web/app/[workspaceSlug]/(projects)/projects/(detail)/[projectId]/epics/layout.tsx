"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { PageHead } from "@/components/core";
import { useProject } from "@/hooks/store";
// plane web components
import { EpicsUpgrade } from "@/plane-web/components/epics/upgrade";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const EpicsLayout = observer(({ children }: { children: ReactNode }) => {
  // router
  const { projectId } = useParams();
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
      <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
        <EpicsUpgrade />
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
