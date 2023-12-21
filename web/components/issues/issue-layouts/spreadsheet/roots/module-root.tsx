import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      issues.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      issues.removeIssue(workspaceSlug, issue.project, issue.id, moduleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      issues.removeIssueFromModule(workspaceSlug, issue.project, moduleId, issue.id);
    },
  };

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
