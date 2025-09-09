import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType } from "@plane/constants";
// types
import {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IssuePaginationOptions,
  TIssue,
  TIssueKanbanFilters,
  TLoader,
} from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssueActions } from "@/hooks/use-issues-actions";

export const useTeamIssueActions: () => IssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !teamspaceId) return;
      return issues.fetchIssues(workspaceSlug, teamspaceId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), teamspaceId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, teamspaceId);
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
      return await issuesFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters);
    },
    [issuesFilter.updateFilters, teamspaceId, workspaceSlug]
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
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  const viewId = routerViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      return issues.fetchIssues(workspaceSlug, teamspaceId, viewId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId, viewId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      return issues.fetchNextIssues(workspaceSlug, teamspaceId, viewId, groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId, viewId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !teamspaceId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, teamspaceId);
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
      return await issuesFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters, viewId);
    },
    [issuesFilter.updateFilters, viewId, teamspaceId, workspaceSlug]
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

export const useTeamProjectWorkItemsActions: () => IssueActions = () => {
  // router
  const {
    workspaceSlug: routerWorkspaceSlug,
    teamspaceId: routerTeamSpaceId,
    projectId: routerProjectId,
  } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  const projectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !teamspaceId || !projectId) return;
      return issues.fetchIssues(workspaceSlug, teamspaceId, projectId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId || !projectId) return;
      return issues.fetchNextIssues(workspaceSlug, teamspaceId, projectId, groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, teamspaceId, projectId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !teamspaceId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, teamspaceId);
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
      if (!projectId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters, projectId);
    },
    [issuesFilter.updateFilters, projectId, teamspaceId, workspaceSlug]
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
