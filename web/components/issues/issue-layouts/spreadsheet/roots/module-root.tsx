import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, moduleId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        issues.removeIssue(workspaceSlug, issue.project_id, issue.id, moduleId);
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        issues.removeIssueFromModule(workspaceSlug, issue.project_id, moduleId, issue.id);
      },
    }),
    [issues, workspaceSlug, moduleId]
  );

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      viewId={moduleId}
      issueActions={issueActions}
      QuickActions={ModuleIssueQuickActions}
    />
  );
});
