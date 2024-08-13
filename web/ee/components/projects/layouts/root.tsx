"use client";

import { observer } from "mobx-react";
// plane web components
import { EmptyState } from "@/components/empty-state";
import { EmptyStateType } from "@/constants/empty-state";
import { useCommandPalette, useEventTracker, useProject } from "@/hooks/store";
import { ProjectBoardLayout } from "@/plane-web/components/projects/layouts";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states";
// types
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
// plane web components
import { BaseProjectRoot } from "./gallery/base-gallery-root";
import { BaseGanttRoot } from "./gantt/base-gantt-root";
import { BaseSpreadsheetRoot } from "./spreadsheet/base-spreadsheet-root";

export const ProjectLayoutRoot = observer(() => {
  const { filters } = useProjectFilter();
  const { workspaceProjectIds } = useProject();
  const { setTrackElement } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();

  // derived values
  const currentLayout = filters?.layout;
  if (workspaceProjectIds?.length === 0)
    return (
      <div className="flex h-full w-full flex-col">
        <EmptyState
          type={EmptyStateType.WORKSPACE_PROJECTS}
          primaryButtonOnClick={() => {
            setTrackElement("Project empty state");
            toggleCreateProjectModal(true);
          }}
        />
      </div>
    );
  const ProjectLayout = (props: { activeLayout: EProjectLayouts | undefined }) => {
    switch (props.activeLayout) {
      case EProjectLayouts.BOARD:
        return <ProjectBoardLayout />;
      case EProjectLayouts.TIMELINE:
        return <BaseGanttRoot />;
      case EProjectLayouts.GALLERY:
        return <BaseProjectRoot />;
      case EProjectLayouts.TABLE:
        return <BaseSpreadsheetRoot />;
      default:
        return <></>;
    }
  };

  return <ProjectLayout activeLayout={currentLayout} />;
});
