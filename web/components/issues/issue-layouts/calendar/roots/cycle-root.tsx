import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
//hooks
import { useIssues } from "hooks/store";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";
import { useMemo } from "react";

export const CycleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

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
    }),
    [issues, workspaceSlug, cycleId, projectId]
  );

  if (!cycleId) return null;

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      viewId={cycleId.toString()}
    />
  );
});
