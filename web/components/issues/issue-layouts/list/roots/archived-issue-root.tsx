import { FC, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { ArchivedIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssueActions } from "../../types";
import { EIssuesStoreType } from "constants/issue";

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
