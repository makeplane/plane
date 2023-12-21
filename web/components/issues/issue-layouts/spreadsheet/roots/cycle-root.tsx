import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { useRouter } from "next/router";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query as { workspaceSlug: string; cycleId: string };

  const {
    cycleIssues: cycleIssueStore,
    cycleIssuesFilter: cycleIssueFilterStore,
    cycle: { fetchCycleWithId },
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await cycleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, cycleId);
      fetchCycleWithId(workspaceSlug, issue.project, cycleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      await cycleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, cycleId);
      fetchCycleWithId(workspaceSlug, issue.project, cycleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;
      await cycleIssueStore.removeIssueFromCycle(workspaceSlug, issue.project, cycleId, issue.id, issue.bridge_id);
      fetchCycleWithId(workspaceSlug, issue.project, cycleId);
    },
  };

  return (
    <BaseSpreadsheetRoot
      issueStore={cycleIssueStore}
      issueFiltersStore={cycleIssueFilterStore}
      viewId={cycleId}
      issueActions={issueActions}
      QuickActions={CycleIssueQuickActions}
    />
  );
});
