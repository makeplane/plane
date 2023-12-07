import React from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { useRouter } from "next/router";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  const { moduleIssues: moduleIssueStore, moduleIssuesFilter: moduleIssueFilterStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      moduleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, moduleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;
      moduleIssueStore.removeIssueFromModule(workspaceSlug, issue.project, moduleId, issue.id, issue.bridge_id);
    },
  };

  return (
    <BaseSpreadsheetRoot
      issueStore={moduleIssueStore}
      issueFiltersStore={moduleIssueFilterStore}
      viewId={moduleId}
      issueActions={issueActions}
      QuickActions={ModuleIssueQuickActions}
    />
  );
});
