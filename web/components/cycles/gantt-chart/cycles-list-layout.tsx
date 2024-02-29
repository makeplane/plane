import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useCycle, useUser } from "hooks/store";
// components
import { GanttChartRoot, IBlockUpdateData, CycleGanttSidebar } from "components/gantt-chart";
import { CycleGanttBlock } from "components/cycles";
// types
import { ICycle } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

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
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getCycleById, updateCycleDetails } = useCycle();

  const handleCycleUpdate = async (cycle: ICycle, data: IBlockUpdateData) => {
    if (!workspaceSlug || !cycle) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateCycleDetails(workspaceSlug.toString(), cycle.project_id, cycle.id, payload);
  };

  const blockFormat = (blocks: (ICycle | null)[]) => {
    if (!blocks) return [];

    const filteredBlocks = blocks.filter((b) => b !== null && b.start_date && b.end_date);

    const structuredBlocks = filteredBlocks.map((block) => ({
      data: block,
      id: block?.id ?? "",
      sort_order: block?.sort_order ?? 0,
      start_date: new Date(block?.start_date ?? ""),
      target_date: new Date(block?.end_date ?? ""),
    }));

    return structuredBlocks;
  };

  const isAllowed =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="h-full w-full overflow-y-auto">
      <GanttChartRoot
        title="Cycles"
        loaderTitle="Cycles"
        blocks={cycleIds ? blockFormat(cycleIds.map((c) => getCycleById(c))) : null}
        blockUpdateHandler={(block, payload) => handleCycleUpdate(block, payload)}
        sidebarToRender={(props) => <CycleGanttSidebar {...props} />}
        blockToRender={(data: ICycle) => <CycleGanttBlock cycleId={data.id} />}
        enableBlockLeftResize={false}
        enableBlockRightResize={false}
        enableBlockMove={false}
        enableReorder={isAllowed}
      />
    </div>
  );
});
