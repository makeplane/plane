import { FC, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { ArchivedIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssueActions } from "../../types";
import { EProjectStore } from "store/application/command-palette.store";
import { EIssuesStoreType } from "constants/issue";

export const ArchivedIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  const issueActions = useMemo(
    () => ({
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug || !projectId) return;

        await issues.removeIssue(workspaceSlug, projectId, issue.id);
      },
    }),
    [issues, workspaceSlug, projectId]
  );

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ArchivedIssueQuickActions}
      issueActions={issueActions}
      currentStore={EProjectStore.PROJECT}
    />
  );
});
