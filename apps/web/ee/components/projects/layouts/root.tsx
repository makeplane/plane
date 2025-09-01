"use client";

import { observer } from "mobx-react";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
// local imports
import { ProjectBoardLayout } from "./board";
import { BaseProjectRoot } from "./gallery/base-gallery-root";
import { BaseGanttRoot } from "./gantt/base-gantt-root";
import { BaseListRoot } from "./list/base-list-root";

export const ProjectLayoutRoot = observer(() => {
  const { filters } = useProjectFilter();

  // derived values
  const currentLayout = filters?.layout;

  const ProjectLayout = (props: { activeLayout: EProjectLayouts | undefined }) => {
    switch (props.activeLayout) {
      case EProjectLayouts.BOARD:
        return <ProjectBoardLayout />;
      case EProjectLayouts.TIMELINE:
        return <BaseGanttRoot />;
      case EProjectLayouts.GALLERY:
        return <BaseProjectRoot />;
      case EProjectLayouts.TABLE:
        return <BaseListRoot />;
      default:
        return <></>;
    }
  };

  return <ProjectLayout activeLayout={currentLayout} />;
});
