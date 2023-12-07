import React from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { useRouter } from "next/router";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { projectIssues: projectIssuesStore, projectIssuesFilter: projectIssueFiltersStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssuesStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssuesStore.removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  return (
    <BaseSpreadsheetRoot
      issueStore={projectIssuesStore}
      issueFiltersStore={projectIssueFiltersStore}
      issueActions={issueActions}
      QuickActions={ProjectIssueQuickActions}
    />
  );
});
