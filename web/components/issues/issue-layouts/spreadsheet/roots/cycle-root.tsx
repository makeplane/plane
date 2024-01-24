import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query as { workspaceSlug: string; cycleId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue, cycleId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;
        issues.removeIssue(workspaceSlug, issue.project_id, issue.id, cycleId);
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;
        issues.removeIssueFromCycle(workspaceSlug, issue.project_id, cycleId, issue.id);
      },
    }),
    [issues, workspaceSlug, cycleId]
  );

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      viewId={cycleId}
      issueActions={issueActions}
      QuickActions={CycleIssueQuickActions}
    />
  );
});
