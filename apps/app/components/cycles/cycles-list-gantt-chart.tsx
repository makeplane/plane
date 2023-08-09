import { FC } from "react";

import { useRouter } from "next/router";

import { KeyedMutator } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useUser from "hooks/use-user";
// components
import { CycleGanttBlock, GanttChartRoot } from "components/gantt-chart";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { ICycle } from "types";

type Props = {
  cycles: ICycle[];
  mutateCycles: KeyedMutator<ICycle[]>;
};

export const CyclesListGanttChartView: FC<Props> = ({ cycles, mutateCycles }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: "rgb(var(--color-primary-100))" }}
      />
      <div className="text-custom-text-100 text-sm">{data?.name}</div>
    </div>
  );

  const handleCycleUpdate = (
    cycle: ICycle,
    payload: { sort_order?: number; start_date?: string; target_date?: string }
  ) => {
    if (!workspaceSlug || !user) return;

    mutateCycles((prevData) => {
      if (!prevData) return prevData;

      const newList = prevData.map((p) => ({
        ...p,
        ...(p.id === cycle.id ? payload : {}),
      }));

      return payload.sort_order ? orderArrayBy(newList, "sort_order") : newList;
    }, false);

    cyclesService
      .patchCycle(workspaceSlug.toString(), cycle.project, cycle.id, payload, user)
      .finally(() => mutateCycles());
  };

  const blockFormat = (blocks: ICycle[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b) => b.start_date && b.end_date)
          .map((block) => ({
            data: block,
            sort_order: block.sort_order,
            start_date: new Date(block.start_date ?? ""),
            target_date: new Date(block.end_date ?? ""),
          }))
      : [];

  return (
    <div className="w-full h-full overflow-y-auto">
      <GanttChartRoot
        title="Cycles"
        loaderTitle="Cycles"
        blocks={cycles ? blockFormat(cycles) : null}
        blockUpdateHandler={(block, payload) => handleCycleUpdate(block, payload)}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <CycleGanttBlock cycle={data as ICycle} />}
        enableLeftDrag={false}
        enableRightDrag={false}
      />
    </div>
  );
};
