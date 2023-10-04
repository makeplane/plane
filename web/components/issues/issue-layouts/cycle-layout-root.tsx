import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { CycleListLayout } from "./list/cycle-root";
import { CycleKanBanLayout } from "./kanban/cycle-root";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const CycleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  const {
    project: projectStore,
    cycle: cycleStore,
    cycleFilter: cycleFilterStore,
    cycleIssue: cycleIssueStore,
  } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `MODULE_ISSUES` : null, async () => {
    if (workspaceSlug && projectId && cycleId) {
      await cycleFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
      await cycleStore.fetchCycleWithId(workspaceSlug, projectId, cycleId);

      await projectStore.fetchProjectStates(workspaceSlug, projectId);
      await projectStore.fetchProjectLabels(workspaceSlug, projectId);
      await projectStore.fetchProjectMembers(workspaceSlug, projectId);

      await cycleIssueStore.fetchIssues(workspaceSlug, projectId, cycleId);
    }
  });

  const activeLayout = cycleFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto border border-red-500">
      {activeLayout === "list" ? <CycleListLayout /> : activeLayout === "kanban" ? <CycleKanBanLayout /> : null}
    </div>
  );
});
