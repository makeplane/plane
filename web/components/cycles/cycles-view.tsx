import { FC } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CyclesBoard, CyclesList } from "components/cycles";
import { Loader } from "@plane/ui";

export interface ICyclesView {
  filter: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete";
  view: "list" | "board" | "gantt";
  workspaceSlug: string;
  projectId: string;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { filter, view, workspaceSlug, projectId } = props;
  // store
  const { cycle: cycleStore } = useMobxStore();
  // api call to fetch cycles list
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `CYCLES_LIST_${projectId}_${filter}` : null,
    workspaceSlug && projectId ? () => cycleStore.fetchCycles(workspaceSlug, projectId, filter) : null
  );

  const cyclesList = cycleStore.cycles?.[projectId];
  console.log("cyclesList", cyclesList);

  return (
    <>
      {view === "list" && (
        <>
          {!isLoading ? (
            <CyclesList cycles={cyclesList} filter={filter} />
          ) : (
            <Loader className="space-y-4">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </Loader>
          )}
        </>
      )}
      {view === "board" && (
        <>
          {!isLoading ? (
            <CyclesBoard cycles={cyclesList} filter={filter} />
          ) : (
            <Loader className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
              <Loader.Item height="200px" />
            </Loader>
          )}
        </>
      )}
      {view === "gantt" && <CyclesList cycles={cyclesList} filter={filter} />}
    </>
  );
});
