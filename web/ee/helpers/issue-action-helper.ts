import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, EIssuesStoreType } from "@plane/constants";
// types
import {
  IssuePaginationOptions,
  TIssueKanbanFilters,
  IIssueDisplayProperties,
  IIssueDisplayFilterOptions,
  IIssueFilterOptions,
  TLoader,
  TIssue,
} from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store";
import { IssueActions } from "@/hooks/use-issues-actions";

export const useTeamIssueActions: () => IssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamId = routerTeamId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !teamId) return;
      return issues.fetchIssues(workspaceSlug, teamId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, teamId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), teamId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, teamId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, teamId);
    },
    [issues.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data);
    },
    [issues.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [issues.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, teamId, filterType, filters);
    },
    [issuesFilter.updateFilters, teamId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

export const useTeamViewIssueActions: () => IssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamId = routerTeamId?.toString();
  const viewId = routerViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !teamId || !viewId) return;
      return issues.fetchIssues(workspaceSlug, teamId, viewId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, teamId, viewId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamId || !viewId) return;
      return issues.fetchNextIssues(workspaceSlug, teamId, viewId, groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, teamId, viewId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !teamId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, teamId);
    },
    [issues.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data);
    },
    [issues.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [issues.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!viewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, teamId, filterType, filters, viewId);
    },
    [issuesFilter.updateFilters, viewId, teamId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};
