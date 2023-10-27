import { FC } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "components/cycles";
// ui components
import { Loader } from "components/ui";
// types
import { TCycleLayout } from "types";

export interface ICyclesView {
  filter: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete";
  layout: TCycleLayout;
  workspaceSlug: string;
  projectId: string;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { filter, layout, workspaceSlug, projectId } = props;

  // store
  const { cycle: cycleStore } = useMobxStore();

  // api call to fetch cycles list
  const { isLoading } = useSWR(
    workspaceSlug && projectId && filter ? `CYCLES_LIST_${projectId}_${filter}` : null,
    workspaceSlug && projectId && filter ? () => cycleStore.fetchCycles(workspaceSlug, projectId, filter) : null
  );

  const cyclesList = cycleStore.cycles?.[projectId];

  return (
    <>
      {layout === "list" && (
        <>
          {!isLoading ? (
            <CyclesList cycles={cyclesList} filter={filter} workspaceSlug={workspaceSlug} projectId={projectId} />
          ) : (
            <Loader className="space-y-4">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </Loader>
          )}
        </>
      )}

      {layout === "board" && (
        <>
          {!isLoading ? (
            <CyclesBoard cycles={cyclesList} filter={filter} workspaceSlug={workspaceSlug} projectId={projectId} />
          ) : (
            <Loader className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
            </Loader>
          )}
        </>
      )}

      {layout === "gantt" && (
        <>
          {!isLoading ? (
            <CyclesListGanttChartView cycles={cyclesList} workspaceSlug={workspaceSlug} />
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
