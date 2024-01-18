import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
// mobx store
import { useIssues } from "hooks/store/use-issues";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";
// types
import { TIssue } from "@plane/types";
// constants
import { EIssueActions } from "../../types";
import { EIssuesStoreType } from "constants/issue";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string; projectId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id);
      },
    }),
    [issues, workspaceSlug]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT}
    />
  );
});
