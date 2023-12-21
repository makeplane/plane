import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";

import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { IIssue } from "types";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug, issue.project, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug, issue.project, issue.id);
      },
    }),
    [issues, workspaceSlug]
  );

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      issueActions={issueActions}
      QuickActions={ProjectIssueQuickActions}
    />
  );
});
