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
