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
    cycleIssueCalendarView: cycleIssueCalendarViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //moduleIssueStore.  (workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id);
    },
  };

  return (
    <BaseCalendarRoot
      issueStore={cycleIssueStore}
      calendarViewStore={cycleIssueCalendarViewStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
    />
  );
});
