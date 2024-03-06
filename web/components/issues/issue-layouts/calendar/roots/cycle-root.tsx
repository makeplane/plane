import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
//hooks
import { useCycle, useIssues } from "hooks/store";
// components
import { CycleIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
// constants
import { EIssuesStoreType } from "constants/issue";

export const CycleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, cycleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;
        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, cycleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId || !projectId) return;
        await issues.removeIssueFromCycle(workspaceSlug.toString(), issue.project_id, cycleId.toString(), issue.id);
      },
      [EIssueActions.ARCHIVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;
        await issues.archiveIssue(workspaceSlug.toString(), issue.project_id, issue.id, cycleId.toString());
      },
    }),
    [issues, workspaceSlug, cycleId, projectId]
  );

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
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={CycleIssueQuickActions}
      addIssuesToView={addIssuesToView}
      issueActions={issueActions}
      viewId={cycleId.toString()}
      isCompletedCycle={isCompletedCycle}
    />
  );
});
