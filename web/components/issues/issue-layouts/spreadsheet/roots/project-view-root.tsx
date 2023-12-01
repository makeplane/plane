import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { useRouter } from "next/router";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { viewIssues: projectViewIssuesStore, viewIssuesFilter: projectViewIssueFiltersStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  return (
    <BaseSpreadsheetRoot
      issueStore={projectViewIssuesStore}
      issueFiltersStore={projectViewIssueFiltersStore}
      issueActions={issueActions}
      QuickActions={ProjectIssueQuickActions}
    />
  );
});
