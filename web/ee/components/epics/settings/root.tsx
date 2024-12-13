"use client";

import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
// plane web components
import { useProject } from "@/hooks/store";
import { EpicsEmptyState, EpicPropertiesRoot } from "@/plane-web/components/epics";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const EpicsRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { projectEpics } = useIssueTypes();
  const { getProjectById } = useProject();
  // derived values
  const epicDetails = projectEpics[projectId?.toString()];
  const project = getProjectById(projectId?.toString());
  const isEpicsEnabled = project?.is_epic_enabled;

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="flex flex-col gap-1 border-b border-custom-border-100 pb-3.5 ">
        <h3 className="text-xl font-medium">Epics</h3>
        <p className="text-sm text-custom-text-400">
          For larger bodies of work that span several cycles and can live across modules
        </p>
      </div>
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isEpicsEnabled && epicDetails?.id ? (
          <EpicPropertiesRoot
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            epicId={epicDetails?.id}
          />
        ) : (
          <EpicsEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
        )}
      </div>
    </div>
  );
});
