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
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    projectIssues: issueStore,
    issueCalendarView: issueCalendarViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

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
      issueStore={issueStore}
      calendarViewStore={issueCalendarViewStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
    />
  );
});
