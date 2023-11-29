import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { useRouter } from "next/router";

export const CalendarLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    projectIssues: issueStore,
    issueCalendarView: issueCalendarViewStore,
    projectIssuesFilter: projectIssueFiltersStore,
    calendarHelpers: calendarHelperStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      issueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      issueStore.removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  const handleDragDrop = (source: any, destination: any, issues: IIssue[], issueWithIds: any) => {
    if (calendarHelperStore.handleDragDrop)
      calendarHelperStore.handleDragDrop(
        source,
        destination,
        workspaceSlug,
        projectId,
        issueStore,
        issues,
        issueWithIds
      );
  };

  return (
    <BaseCalendarRoot
      issueStore={issueStore}
      issuesFilterStore={projectIssueFiltersStore}
      calendarViewStore={issueCalendarViewStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      handleDragDrop={handleDragDrop}
    />
  );
});
