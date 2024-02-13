import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";

import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
} from "@plane/types";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

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

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters]
  );

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      issueActions={issueActions}
      QuickActions={ProjectIssueQuickActions}
      updateFilters={updateFilters}
    />
  );
});
