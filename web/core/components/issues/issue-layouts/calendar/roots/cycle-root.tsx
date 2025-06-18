import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@plane/types";
//hooks
import { CycleIssueQuickActions } from "@/components/issues";
import { useCycle, useIssues } from "@/hooks/store";
// components
import { BaseCalendarRoot } from "../base-calendar-root";
// types
// constants

export const CycleCalendarLayout: React.FC = observer(() => {
  const { currentProjectCompletedCycleIds } = useCycle();
  const { workspaceSlug, projectId, cycleId } = useParams();

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
      isCompletedCycle={isCompletedCycle}
      viewId={cycleId?.toString()}
    />
  );
});
