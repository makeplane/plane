import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserProjectRoles } from "@plane/constants";
import { GanttChartRoot, IBlockUpdateData, IBlockUpdateDependencyData } from "@/components/gantt-chart";
import { ETimeLineTypeType, TimeLineTypeContext } from "@/components/gantt-chart/contexts";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { TProject } from "@/plane-web/types/projects";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
//
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { ProjectGanttBlock } from "./blocks";
import { ProjectGanttSidebar } from "./sidebar";

export const BaseGanttRoot: React.FC = observer(() => {
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { workspaceSlug } = useParams();

  const { workspaceProjectsPermissions } = useUserPermissions();
  const { updateProject } = useProject();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.TIMELINE);

  const updateProjectBlockStructure = async (project: TProject, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;
    const payload = { ...data };
    updateProject && (await updateProject(workspaceSlug.toString(), project.id, payload as Partial<TProject>));
  };

  const updateBlockDates = async (blockUpdates: IBlockUpdateDependencyData[]) => {
    const blockUpdate = blockUpdates[0];

    if (!blockUpdate) return;

    const payload: Partial<TProject> = {};

    if (blockUpdate.start_date) payload.start_date = blockUpdate.start_date;
    if (blockUpdate.target_date) payload.target_date = blockUpdate.target_date;

    updateProject && (await updateProject(workspaceSlug.toString(), blockUpdate.id, payload));
  };

  const isAllowed = (projectId: string) =>
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[workspaceSlug.toString()][projectId] &&
    workspaceProjectsPermissions[workspaceSlug.toString()][projectId] >= EUserProjectRoles.ADMIN;

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
