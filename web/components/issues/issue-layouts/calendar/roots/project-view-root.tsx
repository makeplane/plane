import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  const {
    viewIssues: projectViewIssuesStore,
    viewIssuesFilter: projectIssueViewFiltersStore,
    calendarHelpers: { handleDragDrop: handleCalenderDragDrop },
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
  };

  const handleDragDrop = (source: any, destination: any, issues: IIssue[], issueWithIds: any) => {
    if (workspaceSlug && projectId)
      handleCalenderDragDrop(
        source,
        destination,
        workspaceSlug.toString(),
        projectId.toString(),
        projectViewIssuesStore,
        issues,
        issueWithIds
      );
  };

  return (
    <BaseCalendarRoot
      issueStore={projectViewIssuesStore}
      issuesFilterStore={projectIssueViewFiltersStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      handleDragDrop={handleDragDrop}
    />
  );
});
