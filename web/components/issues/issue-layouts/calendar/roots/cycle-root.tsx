import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
//hooks
import { CycleIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { useCycle, useIssues } from "@/hooks/store";
// components
import { BaseCalendarRoot } from "../base-calendar-root";
// types
// constants

export const CycleCalendarLayout: React.FC = observer(() => {
  const { currentProjectCompletedCycleIds } = useCycle();
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { issues } = useIssues(EIssuesStoreType.CYCLE);

  if (!cycleId) return null;

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !cycleId) throw new Error();
      return issues.addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
    },
    [issues?.addIssueToCycle, workspaceSlug, projectId, cycleId]
  );

  return (
    <BaseCalendarRoot
      QuickActions={CycleIssueQuickActions}
      addIssuesToView={addIssuesToView}
      viewId={cycleId.toString()}
      isCompletedCycle={isCompletedCycle}
      storeType={EIssuesStoreType.CYCLE}
    />
  );
});
