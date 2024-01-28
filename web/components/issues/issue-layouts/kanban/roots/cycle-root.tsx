import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// ui
import { CycleIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssuesStoreType } from "constants/issue";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
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
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={CycleIssueQuickActions}
      viewId={cycleId?.toString() ?? ""}
      storeType={EIssuesStoreType.CYCLE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !cycleId) throw new Error();
        return issues.addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
      }}
    />
  );
});
