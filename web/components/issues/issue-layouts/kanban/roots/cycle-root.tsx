import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useCycle, useIssues } from "hooks/store";
// ui
import { CycleIssueQuickActions } from "components/issues";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
} from "@plane/types";
import { EIssueActions } from "../../types";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, cycleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, cycleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !cycleId) return;

        await issues.removeIssueFromCycle(workspaceSlug.toString(), issue.project_id, cycleId.toString(), issue.id);
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
      if (!cycleId) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, cycleId.toString());
    },
    [cycleId, issuesFilter.updateFilters]
  );

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!cycleId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, payload, cycleId.toString());
    },
    [issues.updateIssue, cycleId]
  );

  const removeIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string) => {
      if (!cycleId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, cycleId.toString());
    },
    [issues.removeIssue, cycleId]
  );

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const canEditIssueProperties = () => !isCompletedCycle;

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={CycleIssueQuickActions}
      viewId={cycleId?.toString() ?? ""}
      storeType={EIssuesStoreType.CYCLE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !cycleId) throw new Error();
        return issues.addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
      }}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      isCompletedCycle={isCompletedCycle}
      updateFilters={updateFilters}
      removeIssue={removeIssue}
      updateIssue={updateIssue}
    />
  );
});
