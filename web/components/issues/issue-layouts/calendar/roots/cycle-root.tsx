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
    cycleIssueCalendarView: cycleIssueCalendarViewStore,
    calendarHelpers: calendarHelperStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, cycleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, cycleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;
      cycleIssueStore.removeIssueFromCycle(workspaceSlug, issue.project, cycleId, issue.id, issue.bridge_id);
    },
  };

  const handleDragDrop = (source: any, destination: any, issues: IIssue[], issueWithIds: any) => {
    if (calendarHelperStore.handleDragDrop)
      calendarHelperStore.handleDragDrop(
        source,
        destination,
        workspaceSlug,
        projectId,
        cycleIssueStore,
        issues,
        issueWithIds,
        cycleId
      );
  };

  return (
    <BaseCalendarRoot
      issueStore={cycleIssueStore}
      issuesFilterStore={cycleIssueFilterStore}
      calendarViewStore={cycleIssueCalendarViewStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      viewId={cycleId}
      handleDragDrop={handleDragDrop}
    />
  );
});
