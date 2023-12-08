import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";

export const CycleCalendarLayout: React.FC = observer(() => {
  const {
    cycleIssues: cycleIssueStore,
    cycleIssuesFilter: cycleIssueFilterStore,
    calendarHelpers: { handleDragDrop: handleCalenderDragDrop },
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, cycleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      await cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id, cycleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !projectId || !issue.bridge_id) return;
      await cycleIssueStore.removeIssueFromCycle(
        workspaceSlug.toString(),
        issue.project,
        cycleId.toString(),
        issue.id,
        issue.bridge_id
      );
    },
  };

  const handleDragDrop = (source: any, destination: any, issues: IIssue[], issueWithIds: any) => {
    if (workspaceSlug && projectId && cycleId)
      handleCalenderDragDrop(
        source,
        destination,
        workspaceSlug.toString(),
        projectId.toString(),
        cycleIssueStore,
        issues,
        issueWithIds,
        cycleId.toString()
      );
  };

  if (!cycleId) return null;

  return (
    <BaseCalendarRoot
      issueStore={cycleIssueStore}
      issuesFilterStore={cycleIssueFilterStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      viewId={cycleId.toString()}
      handleDragDrop={handleDragDrop}
    />
  );
});
