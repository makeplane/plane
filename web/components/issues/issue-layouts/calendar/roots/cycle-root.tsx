import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
//hooks
import { useCycle, useIssues } from "hooks/store";
// components
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
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const CycleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

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
        if (!workspaceSlug || !cycleId || !projectId) return;
        await issues.removeIssueFromCycle(workspaceSlug.toString(), issue.project_id, cycleId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, cycleId, projectId]
  );

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!cycleId) return;
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, cycleId.toString());
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

  if (!cycleId) return null;

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      viewId={cycleId.toString()}
      isCompletedCycle={isCompletedCycle}
      updateFilters={updateFilters}
      updateIssue={updateIssue}
    />
  );
});
