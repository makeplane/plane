import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useCycle } from "hooks/store";
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "components/cycles";
// ui components
import { Loader } from "@plane/ui";
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
  } = useCycle();

  const cyclesList =
    filter === "completed"
      ? currentProjectCompletedCycleIds
      : filter === "draft"
      ? currentProjectDraftCycleIds
      : filter === "upcoming"
      ? currentProjectUpcomingCycleIds
      : currentProjectCycleIds;

  return (
    <>
      {layout === "list" && (
        <>
          {cyclesList ? (
            <CyclesList cycleIds={cyclesList} filter={filter} workspaceSlug={workspaceSlug} projectId={projectId} />
          ) : (
            <Loader className="space-y-4 p-8">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </Loader>
          )}
        </>
      )}

      {layout === "board" && (
        <>
          {cyclesList ? (
            <CyclesBoard
              cycleIds={cyclesList}
              filter={filter}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              peekCycle={peekCycle}
            />
          ) : (
            <Loader className="grid grid-cols-1 gap-9 p-8 md:grid-cols-2 lg:grid-cols-3">
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
            </Loader>
          )}
        </>
      )}

      {layout === "gantt" && (
        <>
          {cyclesList ? (
            <CyclesListGanttChartView cycleIds={cyclesList} workspaceSlug={workspaceSlug} />
          ) : (
            <Loader className="space-y-4">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </Loader>
          )}
        </>
      )}
    </>
  );
});
