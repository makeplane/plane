import { FC, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ArchivedIssueQuickActions } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
// components
// types
import { TIssue } from "@plane/types";
// constants
import { EIssueActions } from "../../types";
import { BaseListRoot } from "../base-list-root";

export const ArchivedIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  const issueActions = useMemo(
    () => ({
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !projectId) return;

        await issues.removeIssue(workspaceSlug, projectId, issue.id);
      },
      [EIssueActions.RESTORE]: async (issue: TIssue) => {
        if (!workspaceSlug || !projectId) return;

        await issues.restoreIssue(workspaceSlug, projectId, issue.id);
      },
    }),
    [issues, workspaceSlug, projectId]
  );

  const canEditPropertiesBasedOnProject = () => false;

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ArchivedIssueQuickActions}
      issueActions={issueActions}
      storeType={EIssuesStoreType.PROJECT}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
