import { FC } from "react";

import { useRouter } from "next/router";

import { KeyedMutator } from "swr";

// services
import modulesService from "services/modules.service";
// hooks
import useUser from "hooks/use-user";
// components
import { GanttChartRoot, IBlockUpdateData, ModuleGanttBlock } from "components/gantt-chart";
// types
import { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

type Props = {
  modules: IModule[];
  mutateModules: KeyedMutator<IModule[]>;
};

export const ModulesListGanttChartView: FC<Props> = ({ modules, mutateModules }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{
          backgroundColor: MODULE_STATUS.find((s) => s.value === data.status)?.color,
        }}
      />
      <div className="text-custom-text-100 text-sm">{data?.name}</div>
    </div>
  );

  const handleModuleUpdate = (module: IModule, payload: IBlockUpdateData) => {
    if (!workspaceSlug || !user) return;

    mutateModules((prevData: any) => {
      if (!prevData) return prevData;

      const newList = prevData.map((p: any) => ({
        ...p,
        ...(p.id === module.id
          ? {
              start_date: payload.start_date ? payload.start_date : p.start_date,
              target_date: payload.target_date ? payload.target_date : p.target_date,
              sort_order: payload.sort_order ? payload.sort_order.newSortOrder : p.sort_order,
            }
          : {}),
      }));

      if (payload.sort_order) {
        const removedElement = newList.splice(payload.sort_order.sourceIndex, 1)[0];
        newList.splice(payload.sort_order.destinationIndex, 0, removedElement);
      }

      return newList;
    }, false);

    const newPayload: any = { ...payload };

    if (newPayload.sort_order && payload.sort_order)
      newPayload.sort_order = payload.sort_order.newSortOrder;

    modulesService.patchModule(
      workspaceSlug.toString(),
      module.project,
      module.id,
      newPayload,
      user
    );
  };

  const blockFormat = (blocks: IModule[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b) => b.start_date && b.target_date)
          .map((block) => ({
            data: block,
            id: block.id,
            sort_order: block.sort_order,
            start_date: new Date(block.start_date ?? ""),
            target_date: new Date(block.target_date ?? ""),
          }))
      : [];

  return (
    <div className="w-full h-full overflow-y-auto">
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blocks={modules ? blockFormat(modules) : null}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <ModuleGanttBlock module={data as IModule} />}
      />
    </div>
  );
};
