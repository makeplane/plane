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

  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, cycleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, cycleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;
      cycleIssueStore.removeIssueFromCycle(workspaceSlug, issue.project, cycleId, issue.id, issue.bridge_id);
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
