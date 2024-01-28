import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";

import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id);
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
