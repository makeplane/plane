import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
import { IBlockUpdateData, IBlockUpdateDependencyData } from "@plane/types";
// components
import { GanttChartRoot } from "@/components/gantt-chart";
import { ETimeLineTypeType, TimeLineTypeContext } from "@/components/gantt-chart/contexts";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { TProject } from "@/plane-web/types/projects";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
// local imports
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { ProjectGanttBlock } from "./blocks";
import { ProjectGanttSidebar } from "./sidebar";

export const BaseGanttRoot: React.FC = observer(() => {
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { updateProject } = useProject();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.TIMELINE);

  const updateProjectBlockStructure = async (project: TProject, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;
    const payload = { ...data };
    if (updateProject) {
      await updateProject(workspaceSlug.toString(), project.id, payload as Partial<TProject>);
    }
  };

  const updateBlockDates = async (blockUpdates: IBlockUpdateDependencyData[]) => {
    const blockUpdate = blockUpdates[0];

    if (!blockUpdate) return;

    const payload: Partial<TProject> = {};

    if (blockUpdate.start_date) payload.start_date = blockUpdate.start_date;
    if (blockUpdate.target_date) payload.target_date = blockUpdate.target_date;

    if (updateProject) {
      await updateProject(workspaceSlug.toString(), blockUpdate.id, payload);
    }
  };

  const isAllowed = (projectId: string) =>
    allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug.toString(), projectId);

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.TIMELINE}>
      <TimeLineTypeContext.Provider value={ETimeLineTypeType.PROJECT}>
        <div className="h-full w-full">
          <GanttChartRoot
            border={false}
            title="Projects"
            loaderTitle="Projects"
            blockIds={filteredProjectIds || []}
            blockUpdateHandler={updateProjectBlockStructure}
            blockToRender={(data: TProject) => <ProjectGanttBlock projectId={data.id} />}
            sidebarToRender={(props) => <ProjectGanttSidebar {...props} showAllBlocks />}
            enableBlockLeftResize={isAllowed}
            enableBlockRightResize={isAllowed}
            enableBlockMove={isAllowed}
            enableAddBlock={isAllowed}
            enableSelection={false}
            showToday={false}
            updateBlockDates={updateBlockDates}
            showAllBlocks
          />
        </div>
      </TimeLineTypeContext.Provider>
    </ProjectLayoutHOC>
  );
});
