"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ProjectBoardGroup } from "@/plane-web/components/projects/layouts/board";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";

export const ProjectBoardLayout: FC = observer(() => {
  // hooks

  const { getFilteredProjectsByLayout } = useProjectFilter();

  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);

  if (!groupByProjectIds) return <></>;
  return (
    <div className="w-full h-full overflow-hidden">
      <ProjectBoardGroup groupByProjectIds={groupByProjectIds} />
    </div>
  );
});
