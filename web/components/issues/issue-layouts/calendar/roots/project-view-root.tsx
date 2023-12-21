import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";
import { useMemo } from "react";

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: IIssue) => {
        if (!workspaceSlug || !projectId) return;

        await issues.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug || !projectId) return;

        await issues.removeIssue(workspaceSlug.toString(), projectId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, projectId]
  );

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      viewId={viewId?.toString()}
    />
  );
});
