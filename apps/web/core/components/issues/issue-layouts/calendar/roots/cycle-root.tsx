import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
// components
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

export const CycleCalendarLayout = observer(function CycleCalendarLayout() {
  const { currentProjectCompletedCycleIds } = useCycle();
  const { workspaceSlug, projectId, cycleId } = useParams();

  const {
    issues: { addIssueToCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !cycleId) throw new Error();
      return addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
    },
    [addIssueToCycle, workspaceSlug, projectId, cycleId]
  );

  if (!cycleId) return null;

  return (
    <BaseCalendarRoot
      QuickActions={CycleIssueQuickActions}
      addIssuesToView={addIssuesToView}
      isCompletedCycle={isCompletedCycle}
      viewId={cycleId?.toString()}
    />
  );
});
