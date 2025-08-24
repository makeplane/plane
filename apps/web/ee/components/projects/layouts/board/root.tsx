"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ContentWrapper } from "@plane/ui";
import { ProjectBoardGroup } from "@/plane-web/components/projects/layouts/board/group";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
import { ProjectLayoutHOC } from "../project-layout-HOC";

export const ProjectBoardLayout: FC = observer(() => {
  // hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();

  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.BOARD}>
      <ContentWrapper className="!py-0">
        <ProjectBoardGroup groupByProjectIds={groupByProjectIds || {}} />
      </ContentWrapper>
    </ProjectLayoutHOC>
  );
});
