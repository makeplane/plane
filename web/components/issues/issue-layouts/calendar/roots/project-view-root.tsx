import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart, ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  const {
    viewIssues: projectViewIssuesStore,
    issueDetail: issueDetailStore,
    projectViewIssueCalendarView: projectViewIssueCalendarViewStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
  };

  return (
    <BaseCalendarRoot
      issueStore={projectViewIssuesStore}
      calendarViewStore={projectViewIssueCalendarViewStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
    />
  );
});
