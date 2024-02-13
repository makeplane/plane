import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useCycle, useIssues } from "hooks/store";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { EIssueActions } from "../../types";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
} from "@plane/types";
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query as { workspaceSlug: string; cycleId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();

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

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, cycleId);
    },
    [cycleId, issuesFilter.updateFilters]
  );

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const canEditIssueProperties = () => !isCompletedCycle;

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      viewId={cycleId}
      issueActions={issueActions}
      QuickActions={CycleIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      isCompletedCycle={isCompletedCycle}
      updateFilters={updateFilters}
    />
  );
});
