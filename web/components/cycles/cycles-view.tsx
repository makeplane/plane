import { useRouter } from "next/router";
import { FC } from "react";
import useSWR from "swr";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CyclesList } from "components/cycles";

export interface ICyclesView {
  filter: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete";
  view: "list" | "board" | "gantt";
}

export const CyclesView: FC<ICyclesView> = (props) => {
  const { filter, view } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { cycle: cycleStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `CYCLES_LIST_${projectId}` : null,
    workspaceSlug && projectId
      ? () => cycleStore.fetchCycles(workspaceSlug.toString(), projectId.toString(), filter)
      : null
  );
  if (!projectId) {
    return <></>;
  }
  return (
    <>
      {view === "list" && <CyclesList cycles={cycleStore.cycles[projectId?.toString()]} />}
      {view === "board" && <CyclesList cycles={cycleStore.cycles[projectId?.toString()]} />}
      {view === "gantt" && <CyclesList cycles={cycleStore.cycles[projectId?.toString()]} />}
    </>
  );
};
