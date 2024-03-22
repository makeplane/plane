import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { CycleGanttBlock } from "components/cycles";
import { GanttChartRoot, IBlockUpdateData, CycleGanttSidebar, ChartDataType } from "components/gantt-chart";
import { useCycle } from "hooks/store";
// components
// types
import { ICycle } from "@plane/types";
import { getMonthChartItemPositionWidthInMonth } from "components/gantt-chart/views";
// constants

type Props = {
  workspaceSlug: string;
  cycleIds: string[];
};

export const CyclesListGanttChartView: FC<Props> = observer((props) => {
  const { cycleIds } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { getCycleById, updateCycleDetails } = useCycle();

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const cycle = getCycleById(id);
      const block = {
        data: cycle,
        id: cycle?.id ?? "",
        sort_order: cycle?.sort_order ?? 0,
        start_date: cycle?.start_date ? new Date(cycle?.start_date) : undefined,
        target_date: cycle?.end_date ? new Date(cycle?.end_date) : undefined,
      };

      if (currentViewData) {
        return {
          ...block,
          position: getMonthChartItemPositionWidthInMonth(currentViewData, block),
        };
      }
      return block;
    },
    [getCycleById]
  );

  const handleCycleUpdate = async (cycle: ICycle, data: IBlockUpdateData) => {
    if (!workspaceSlug || !cycle) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateCycleDetails(workspaceSlug.toString(), cycle.project_id, cycle.id, payload);
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <GanttChartRoot
        title="Cycles"
        loaderTitle="Cycles"
        blockIds={cycleIds}
        getBlockById={getBlockById}
        blockUpdateHandler={(block, payload) => handleCycleUpdate(block, payload)}
        sidebarToRender={(props) => <CycleGanttSidebar {...props} />}
        blockToRender={(data: ICycle) => <CycleGanttBlock cycleId={data.id} />}
        enableBlockLeftResize={false}
        enableBlockRightResize={false}
        enableBlockMove={false}
        enableReorder={false}
      />
    </div>
  );
});
