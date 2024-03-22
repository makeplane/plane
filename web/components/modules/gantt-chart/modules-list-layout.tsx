import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
// components
import { ChartDataType, GanttChartRoot, IBlockUpdateData, ModuleGanttSidebar } from "components/gantt-chart";
import { ModuleGanttBlock } from "components/modules";
import { useModule, useProject } from "hooks/store";
// types
import { IModule } from "@plane/types";
import { useCallback } from "react";
import { getMonthChartItemPositionWidthInMonth } from "components/gantt-chart/views";

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { currentProjectDetails } = useProject();
  const { projectModuleIds, getModuleById, updateModuleDetails } = useModule();

  const handleModuleUpdate = async (module: IModule, data: IBlockUpdateData) => {
    if (!workspaceSlug || !module) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateModuleDetails(workspaceSlug.toString(), module.project_id, module.id, payload);
  };

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const module = getModuleById(id);

      const block = {
        data: module,
        id: module?.id ?? "",
        sort_order: module?.sort_order ?? 0,
        start_date: module?.start_date ? new Date(module.start_date) : undefined,
        target_date: module?.target_date ? new Date(module.target_date) : undefined,
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

  if (!projectModuleIds) return null;

  return (
    <div className="h-full w-full overflow-y-auto">
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blockIds={projectModuleIds}
        getBlockById={getBlockById}
        sidebarToRender={(props) => <ModuleGanttSidebar {...props} />}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        blockToRender={(data: IModule) => <ModuleGanttBlock moduleId={data.id} />}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={isAllowed}
        enableAddBlock={isAllowed}
        showAllBlocks
      />
    </div>
  );
});
