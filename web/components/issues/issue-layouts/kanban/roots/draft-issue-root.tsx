import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
} from "@plane/types";
// constants
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export interface IKanBanLayout {}

export const DraftKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id);
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

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      return await issues.updateIssue(workspaceSlug, projectId, issueId, payload);
    },
    [issues.updateIssue]
  );

  const removeIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string) => {
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilter={issuesFilter}
      issues={issues}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      updateFilters={updateFilters}
      removeIssue={removeIssue}
      updateIssue={updateIssue}
    />
  );
});
