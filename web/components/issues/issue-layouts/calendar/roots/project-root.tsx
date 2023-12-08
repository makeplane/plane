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
  const { workspaceSlug, projectId } = router.query;

  const {
    projectIssues: issueStore,
    projectIssuesFilter: projectIssueFiltersStore,
    calendarHelpers: { handleDragDrop: handleCalenderDragDrop },
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
  };

  const handleDragDrop = (source: any, destination: any, issues: IIssue[], issueWithIds: any) => {
    if (workspaceSlug && projectId)
      handleCalenderDragDrop(
        source,
        destination,
        workspaceSlug.toString(),
        projectId.toString(),
        issueStore,
        issues,
        issueWithIds
      );
  };

  return (
    <BaseCalendarRoot
      issueStore={issueStore}
      issuesFilterStore={projectIssueFiltersStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      handleDragDrop={handleDragDrop}
    />
  );
});
