import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useCycle } from "hooks/store";
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "components/cycles";
// ui components
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// types
import { TCycleLayout, TCycleView } from "@plane/types";

export interface ICyclesView {
  filter: TCycleView;
  layout: TCycleLayout;
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { filter, layout, workspaceSlug, projectId, peekCycle } = props;
  // store hooks
  const {
    currentProjectCompletedCycleIds,
    currentProjectDraftCycleIds,
    currentProjectUpcomingCycleIds,
    currentProjectCycleIds,
    loader,
  } = useCycle();

  const cyclesList =
    filter === "completed"
      ? currentProjectCompletedCycleIds
      : filter === "draft"
      ? currentProjectDraftCycleIds
      : filter === "upcoming"
      ? currentProjectUpcomingCycleIds
      : currentProjectCycleIds;

  if (loader || !cyclesList)
    return (
      <>
        {layout === "list" && <CycleModuleListLayout />}
        {layout === "board" && <CycleModuleBoardLayout />}
        {layout === "gantt" && <GanttLayoutLoader />}
      </>
    );

  return (
    <>
      {layout === "list" && (
        <CyclesList cycleIds={cyclesList} filter={filter} workspaceSlug={workspaceSlug} projectId={projectId} />
      )}

      {layout === "board" && (
        <CyclesBoard
          cycleIds={cyclesList}
          filter={filter}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          peekCycle={peekCycle}
        />
      )}

      {layout === "gantt" && <CyclesListGanttChartView cycleIds={cyclesList} workspaceSlug={workspaceSlug} />}
    </>
  );
});
