import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssueActions } from "../../types";
import { EIssuesStoreType } from "constants/issue";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;
  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, cycleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, cycleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.removeIssueFromCycle(workspaceSlug.toString(), issue.project_id, cycleId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, cycleId]
  );

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      viewId={cycleId?.toString()}
      storeType={EIssuesStoreType.CYCLE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !cycleId) throw new Error();
        return issues.addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
      }}
    />
  );
});
