import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// PLane
import { IBlockUpdateData, IBlockUpdateDependencyData, IModule } from "@plane/types";
// components
import { GanttChartRoot, ModuleGanttSidebar } from "@/components/gantt-chart";
import { ETimeLineTypeType, TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { ModuleGanttBlock } from "@/components/modules";
// hooks
import { useModule, useModuleFilter, useProject } from "@/hooks/store";

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  const { getFilteredModuleIds, updateModuleDetails } = useModule();
  const { currentProjectDisplayFilters: displayFilters } = useModuleFilter();

  // derived values
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;

  const handleModuleUpdate = async (module: IModule, data: IBlockUpdateData) => {
    if (!workspaceSlug || !module) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateModuleDetails(workspaceSlug.toString(), module.project_id, module.id, payload);
  };

  const updateBlockDates = async (blockUpdates: IBlockUpdateDependencyData[]) => {
    const blockUpdate = blockUpdates[0];

    if (!blockUpdate) return;

    const payload: Partial<IModule> = {};

    if (blockUpdate.start_date) payload.start_date = blockUpdate.start_date;
    if (blockUpdate.target_date) payload.target_date = blockUpdate.target_date;

    await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), blockUpdate.id, payload);
  };

  const isAllowed = currentProjectDetails?.member_role === 20 || currentProjectDetails?.member_role === 15;

  if (!filteredModuleIds) return null;

  return (
    <TimeLineTypeContext.Provider value={ETimeLineTypeType.MODULE}>
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blockIds={filteredModuleIds}
        sidebarToRender={(props) => <ModuleGanttSidebar {...props} />}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        blockToRender={(data: IModule) => <ModuleGanttBlock moduleId={data.id} />}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={isAllowed && displayFilters?.order_by === "sort_order"}
        enableAddBlock={isAllowed}
        updateBlockDates={updateBlockDates}
        showAllBlocks
      />
    </TimeLineTypeContext.Provider>
  );
});
