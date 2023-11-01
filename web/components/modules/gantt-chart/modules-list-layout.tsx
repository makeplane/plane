import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GanttChartRoot, IBlockUpdateData } from "components/gantt-chart";
import { ModuleGanttBlock, ModuleGanttSidebarBlock } from "components/modules";
// types
import { IModule } from "types";

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { project: projectStore, module: moduleStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;
  const modules = moduleStore.projectModules;

  const handleModuleUpdate = (module: IModule, payload: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    moduleStore.updateModuleGanttStructure(workspaceSlug.toString(), module.project, module, payload);
  };

  const blockFormat = (blocks: IModule[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b) => b.start_date && b.target_date && new Date(b.start_date) <= new Date(b.target_date))
          .map((block) => ({
            data: block,
            id: block.id,
            sort_order: block.sort_order,
            start_date: new Date(block.start_date ?? ""),
            target_date: new Date(block.target_date ?? ""),
          }))
      : [];

  const isAllowed = currentProjectDetails?.member_role === 20 || currentProjectDetails?.member_role === 15;

  return (
    <div className="w-full h-full overflow-y-auto">
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blocks={modules ? blockFormat(modules) : null}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        SidebarBlockRender={ModuleGanttSidebarBlock}
        BlockRender={ModuleGanttBlock}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={isAllowed}
      />
    </div>
  );
});
