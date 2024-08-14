import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChartDataType, GanttChartRoot, IBlockUpdateData, IGanttBlock } from "@/components/gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "@/components/gantt-chart/views";
import { EUserProjectRoles } from "@/constants/project";
import { getDate } from "@/helpers/date-time.helper";
//hooks
import { useProject, useUser } from "@/hooks/store";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { TProject } from "@/plane-web/types/projects";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
import { ProjectGanttBlock } from "./blocks";
import { ProjectGanttSidebar } from "./sidebar";

export const BaseGanttRoot: React.FC = observer(() => {
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { projectMap } = useProject();
  const { workspaceSlug } = useParams();

  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { updateProject } = useProject();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.TIMELINE);

  const getProjectBlocksStructure = (block: TProject): IGanttBlock => ({
    data: block,
    id: block?.id,
    sort_order: block && block.sort_order!,
    start_date: getDate(block?.start_date),
    target_date: getDate(block?.target_date),
  });

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const project = projectMap[id] as TProject;
      console.log(JSON.parse(JSON.stringify(project)), getDate(project?.start_date));
      const block = getProjectBlocksStructure(project);
      if (currentViewData) {
        return {
          ...block,
          position: getMonthChartItemPositionWidthInMonth(currentViewData, block),
        };
      }
      return block;
    },
    [projectMap]
  );

  const updateProjectBlockStructure = async (project: TProject, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;
    const payload = { ...data };
    updateProject && (await updateProject(workspaceSlug.toString(), project.id, payload as Partial<TProject>));
  };

  const isAllowed = (projectId: string) =>
    currentWorkspaceAllProjectsRole &&
    currentWorkspaceAllProjectsRole[projectId] &&
    currentWorkspaceAllProjectsRole[projectId] >= EUserProjectRoles.ADMIN;

  return (
    <div className="h-full w-full">
      <GanttChartRoot
        border={false}
        title="Projects"
        loaderTitle="Projects"
        blockIds={filteredProjectIds || []}
        getBlockById={getBlockById}
        blockUpdateHandler={updateProjectBlockStructure}
        blockToRender={(data: TProject) => <ProjectGanttBlock projectId={data.id} />}
        sidebarToRender={(props) => <ProjectGanttSidebar {...props} showAllBlocks />}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableAddBlock={isAllowed}
        enableSelection={false}
        showToday={false}
        showAllBlocks
      />
    </div>
  );
});
