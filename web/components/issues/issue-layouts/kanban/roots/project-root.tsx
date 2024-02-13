import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
// mobx store
import { useIssues } from "hooks/store/use-issues";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";
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
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string; projectId: string };

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
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT}
      updateFilters={updateFilters}
      removeIssue={removeIssue}
      updateIssue={updateIssue}
    />
  );
});
