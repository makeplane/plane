import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IModule } from "@plane/types";
// mobx store
// components
import { ChartDataType, GanttChartRoot, IBlockUpdateData, ModuleGanttSidebar } from "@/components/gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "@/components/gantt-chart/views";
import { ModuleGanttBlock } from "@/components/modules";
import { getDate } from "@/helpers/date-time.helper";
import { useModule, useModuleFilter, useProject } from "@/hooks/store";
// types

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  const { getFilteredModuleIds, getModuleById, updateModuleDetails } = useModule();
  const { currentProjectDisplayFilters: displayFilters } = useModuleFilter();
  // derived values
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;

  const handleModuleUpdate = async (module: IModule, data: IBlockUpdateData) => {
    if (!workspaceSlug || !module) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateModuleDetails(workspaceSlug.toString(), module.project_id, module.id, payload);
  };

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const projectModule = getModuleById(id);

      const block = {
        data: projectModule,
        id: projectModule?.id ?? "",
        sort_order: projectModule?.sort_order ?? 0,
        start_date: getDate(projectModule?.start_date),
        target_date: getDate(projectModule?.target_date),
      };
      if (currentViewData) {
        return {
          ...block,
          position: getMonthChartItemPositionWidthInMonth(currentViewData, block),
        };
      }
      return block;
    },
    [getModuleById]
  );

  const isAllowed = currentProjectDetails?.member_role === 20 || currentProjectDetails?.member_role === 15;

  if (!filteredModuleIds) return null;

  return (
    <GanttChartRoot
      title="Modules"
      loaderTitle="Modules"
      blockIds={filteredModuleIds}
      getBlockById={getBlockById}
      sidebarToRender={(props) => <ModuleGanttSidebar {...props} />}
      blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
      blockToRender={(data: IModule) => <ModuleGanttBlock moduleId={data.id} />}
      enableBlockLeftResize={isAllowed}
      enableBlockRightResize={isAllowed}
      enableBlockMove={isAllowed}
      enableReorder={isAllowed && displayFilters?.order_by === "sort_order"}
      enableAddBlock={isAllowed}
      showAllBlocks
    />
  );
});
