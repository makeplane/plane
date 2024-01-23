import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
import { EIssuesStoreType } from "constants/issue";
import { useMemo } from "react";

export const CalendarLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id);
      },
    }),
    [issues, workspaceSlug]
  );

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
    />
  );
});
