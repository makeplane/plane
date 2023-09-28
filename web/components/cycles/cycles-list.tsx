import { useRouter } from "next/router";
import { FC } from "react";
import useSWR from "swr";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { CyclesView } from "./cycles-view";

export interface ICyclesList {
  filter: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete";
}

export const CyclesList: FC<ICyclesList> = (props) => {
  const { filter } = props;
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
  return <CyclesView cycles={cycleStore.cycles[projectId?.toString()]} viewType={filter} />;
};
