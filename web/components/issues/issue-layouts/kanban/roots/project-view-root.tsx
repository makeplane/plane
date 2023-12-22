import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// constant
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssuesStoreType } from "constants/issue";

export interface IViewKanBanLayout {}

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string; projectId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug, issue.project, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug, issue.project, issue.id);
      },
    }),
    [issues, workspaceSlug]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilter={issuesFilter}
      issues={issues}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EIssuesStoreType.PROJECT_VIEW}
    />
  );
});
