import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useModule, useProject } from "hooks/store";
// components
import { GanttChartRoot, IBlockUpdateData, ModuleGanttSidebar } from "components/gantt-chart";
import { ModuleGanttBlock } from "components/modules";
// types
import { IModule } from "@plane/types";

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { projectModuleIds, moduleMap } = useModule();
  const { currentProjectDetails } = useProject();

  const handleModuleUpdate = (module: IModule, payload: IBlockUpdateData) => {
    if (!workspaceSlug) return;
    //  FIXME
    //updateModuleGanttStructure(workspaceSlug.toString(), module.project, module, payload);
  };

  const blockFormat = (blocks: string[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((blockId) => {
            const block = moduleMap[blockId];
            return block.start_date && block.target_date && new Date(block.start_date) <= new Date(block.target_date);
          })
          .map((blockId) => {
            const block = moduleMap[blockId];
            return {
              data: block,
              id: block.id,
              sort_order: block.sort_order,
              start_date: new Date(block.start_date ?? ""),
              target_date: new Date(block.target_date ?? ""),
            };
          })
      : [];

  const isAllowed = currentProjectDetails?.member_role === 20 || currentProjectDetails?.member_role === 15;

  const modules = projectModuleIds;
  return (
    <div className="h-full w-full overflow-y-auto">
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blocks={projectModuleIds ? blockFormat(projectModuleIds) : null}
        sidebarToRender={(props) => <ModuleGanttSidebar {...props} />}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        blockToRender={(data: IModule) => <ModuleGanttBlock data={data} />}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={isAllowed}
      />
    </div>
  );
});
