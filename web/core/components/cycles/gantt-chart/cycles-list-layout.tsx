import { FC, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ICycle } from "@plane/types";
// components
import { CycleGanttBlock } from "@/components/cycles";
import { GanttChartRoot, IBlockUpdateData, CycleGanttSidebar, ChartDataType } from "@/components/gantt-chart";
import { getMonthChartItemPositionWidthInMonth } from "@/components/gantt-chart/views";
// helpers
import { getDate } from "@/helpers/date-time.helper";
// hooks
import { useCycle } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  cycleIds: string[];
};

export const CyclesListGanttChartView: FC<Props> = observer((props) => {
  const { cycleIds } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getCycleById, updateCycleDetails } = useCycle();

  const getBlockById = useCallback(
    (id: string, currentViewData?: ChartDataType | undefined) => {
      const cycle = getCycleById(id);
      const block = {
        data: cycle,
        id: cycle?.id ?? "",
        sort_order: cycle?.sort_order ?? 0,
        start_date: getDate(cycle?.start_date),
        target_date: getDate(cycle?.end_date),
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
        enableReorder
      />
    </div>
  );
});
