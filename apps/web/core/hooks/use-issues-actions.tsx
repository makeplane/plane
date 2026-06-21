/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo } from "react";
// types
import { useParams } from "next/navigation";
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EDraftIssuePaginationType } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IssuePaginationOptions,
  TIssue,
  TIssuesResponse,
  TLoader,
  TProfileViews,
  TSupportedFilterForUpdate,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { useIssues } from "./store/use-issues";

export interface IssueActions {
  fetchIssues: (
    loadType: TLoader,
    options: IssuePaginationOptions,
    viewId?: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (groupId?: string, subGroupId?: string) => Promise<TIssuesResponse | undefined>;
  removeIssue: (projectId: string | undefined | null, issueId: string) => Promise<void>;
  createIssue?: (projectId: string | undefined | null, data: Partial<TIssue>) => Promise<TIssue | undefined>;
  quickAddIssue?: (projectId: string | undefined | null, data: TIssue) => Promise<TIssue | undefined>;
  updateIssue?: (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssueFromView?: (projectId: string | undefined | null, issueId: string) => Promise<void>;
  archiveIssue?: (projectId: string | undefined | null, issueId: string) => Promise<void>;
  restoreIssue?: (projectId: string | undefined | null, issueId: string) => Promise<void>;
  updateFilters: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
}

export const useIssuesActions = (storeType: EIssuesStoreType): IssueActions => {
  const projectIssueActions = useProjectIssueActions();
  const projectEpicsActions = useProjectEpicsActions();
  const cycleIssueActions = useCycleIssueActions();
  const moduleIssueActions = useModuleIssueActions();
  const projectViewIssueActions = useProjectViewIssueActions();
  const globalIssueActions = useGlobalIssueActions();
  const profileIssueActions = useProfileIssueActions();
  const archivedIssueActions = useArchivedIssueActions();
  const workspaceDraftIssueActions = useWorkspaceDraftIssueActions();

  switch (storeType) {
    case EIssuesStoreType.PROJECT_VIEW:
      return projectViewIssueActions;
    case EIssuesStoreType.PROFILE:
      return profileIssueActions;
    case EIssuesStoreType.ARCHIVED:
      return archivedIssueActions;
    case EIssuesStoreType.CYCLE:
      return cycleIssueActions;
    case EIssuesStoreType.MODULE:
      return moduleIssueActions;
    case EIssuesStoreType.GLOBAL:
      return globalIssueActions;
    case EIssuesStoreType.WORKSPACE_DRAFT:
      //@ts-expect-error type mismatch
      return workspaceDraftIssueActions;
    case EIssuesStoreType.EPIC:
      return projectEpicsActions;
    case EIssuesStoreType.PROJECT:
    default:
      return projectIssueActions;
  }
};

const useProjectIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), routeProjectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), routeProjectId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
    },
    [issues.createIssue, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data);
    },
    [issues.quickAddIssue, workspaceSlug]
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
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, quickAddIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useProjectEpicsActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.EPIC);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), routeProjectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), routeProjectId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
    },
    [issues.createIssue, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data);
    },
    [issues.quickAddIssue, workspaceSlug]
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
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, quickAddIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useCycleIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, cycleId: routerCycleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  const routeCycleId = routerCycleId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, cycleId?: string) => {
      if (!workspaceSlug || !routeProjectId || !cycleId) return;
      return issues.fetchIssues(
        workspaceSlug.toString(),
        routeProjectId.toString(),
        loadType,
        options,
        cycleId.toString()
      );
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId || !routeCycleId) return;
      return issues.fetchNextIssues(
        workspaceSlug.toString(),
        routeProjectId.toString(),
        routeCycleId.toString(),
        groupId,
        subGroupId
      );
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId, routeCycleId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!routeCycleId || !workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, routeCycleId);
    },
    [issues.createIssue, routeCycleId, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!routeCycleId || !workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data, routeCycleId);
    },
    [issues.quickAddIssue, workspaceSlug, routeCycleId]
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
  const removeIssueFromView = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!routeCycleId || !workspaceSlug || !projectId) return;
      return await issues.removeIssueFromCycle(workspaceSlug, projectId, routeCycleId, issueId);
    },
    [issues.removeIssueFromCycle, routeCycleId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [issues.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!routeCycleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, routeCycleId);
    },
    [issuesFilter.updateFilters, routeCycleId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      removeIssueFromView,
      archiveIssue,
      updateFilters,
    }),
    [
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      removeIssueFromView,
      archiveIssue,
      updateFilters,
    ]
  );
};

const useModuleIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, moduleId: routerModuleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  const routeModuleId = routerModuleId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, moduleId?: string) => {
      if (!workspaceSlug || !routeProjectId || !moduleId) return;
      return issues.fetchIssues(
        workspaceSlug.toString(),
        routeProjectId.toString(),
        loadType,
        options,
        moduleId.toString()
      );
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId || !routeModuleId) return;
      return issues.fetchNextIssues(
        workspaceSlug.toString(),
        routeProjectId.toString(),
        routeModuleId.toString(),
        groupId,
        subGroupId
      );
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId, routeModuleId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!routeModuleId || !workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, routeModuleId);
    },
    [issues.createIssue, routeModuleId, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!routeModuleId || !workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data, routeModuleId);
    },
    [issues.quickAddIssue, workspaceSlug, routeModuleId]
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
  const removeIssueFromView = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!routeModuleId || !workspaceSlug || !projectId) return;
      return await issues.removeIssuesFromModule(workspaceSlug, projectId, routeModuleId, [issueId]);
    },
    [issues.removeIssuesFromModule, routeModuleId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [issues.archiveIssue, routeModuleId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!routeModuleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, routeModuleId);
    },
    [issuesFilter.updateFilters, routeModuleId]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      removeIssueFromView,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, createIssue, updateIssue, removeIssue, removeIssueFromView, archiveIssue, updateFilters]
  );
};

const useProfileIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, userId: routerUserId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const userId = routerUserId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROFILE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !userId || !viewId) return;
      return issues.fetchIssues(
        workspaceSlug.toString(),
        userId.toString(),
        loadType,
        options,
        viewId as TProfileViews
      );
    },
    [issues.fetchIssues, workspaceSlug, userId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !userId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), userId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, userId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
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
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!userId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, userId);
    },
    [issuesFilter.updateFilters, userId, workspaceSlug]
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
    [fetchIssues, createIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useProjectViewIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  const routeViewId = routerViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !routeProjectId || !viewId) return;
      return issues.fetchIssues(workspaceSlug.toString(), routeProjectId.toString(), viewId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId || !routeViewId) return;
      return issues.fetchNextIssues(
        workspaceSlug.toString(),
        routeProjectId.toString(),
        routeViewId,
        groupId,
        subGroupId
      );
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
    },
    [issues.createIssue, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data);
    },
    [issues.quickAddIssue, workspaceSlug]
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
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!routeViewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, routeViewId);
    },
    [issuesFilter.updateFilters, routeViewId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      quickAddIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, quickAddIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useArchivedIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const routeProjectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), routeProjectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !routeProjectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), routeProjectId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, routeProjectId]
  );

  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue]
  );
  const restoreIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.restoreIssue(workspaceSlug, projectId, issueId);
    },
    [issues.restoreIssue]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      removeIssue,
      restoreIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, removeIssue, restoreIssue, updateFilters]
  );
};

const useGlobalIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, globalViewId: routerGlobalViewId, workspaceSprintId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const globalViewId = routerGlobalViewId?.toString() ?? (workspaceSprintId ? "all-issues" : undefined);
  const sprintRouteFilters = workspaceSprintId ? { global_sprint_id: workspaceSprintId.toString() } : undefined;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.GLOBAL);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      const globalViewIdValue = viewId ?? globalViewId;
      if (!workspaceSlug || !globalViewIdValue) return;
      return issues.fetchIssues(
        workspaceSlug.toString(),
        globalViewIdValue.toString(),
        loadType,
        options,
        sprintRouteFilters
      );
    },
    [issues.fetchIssues, workspaceSlug, globalViewId, sprintRouteFilters]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !globalViewId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), globalViewId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, globalViewId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
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

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!globalViewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, globalViewId);
    },
    [issuesFilter.updateFilters, globalViewId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      updateIssue,
      removeIssue,
      updateFilters,
    }),
    [createIssue, updateIssue, removeIssue, updateFilters]
  );
};

const useWorkspaceDraftIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, globalViewId: routerGlobalViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const globalViewId = routerGlobalViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);
  const fetchIssues = useCallback(
    async (loadType: TLoader, _options: IssuePaginationOptions) => {
      if (!workspaceSlug) return;
      return issues.fetchIssues(workspaceSlug.toString(), loadType, EDraftIssuePaginationType.INIT);
    },
    [workspaceSlug, issues]
  );

  const fetchNextIssues = useCallback(async () => {
    if (!workspaceSlug) return;
    return issues.fetchIssues(workspaceSlug.toString(), "pagination", EDraftIssuePaginationType.NEXT);
  }, [workspaceSlug, issues]);

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, data);
    },
    [issues, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, issueId, data);
    },
    [issues, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeIssue(issueId);
    },
    [issues, workspaceSlug]
  );

  // const moveToIssue = useCallback(
  //   async (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => {
  //     if (!workspaceSlug || !issueId || !data) return;
  //     return await issues.moveToIssues(workspaceSlug, issueId, data);
  //   },
  //   [issues]
  // );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      filters = filters as IIssueDisplayFilterOptions | IIssueDisplayProperties;
      if (!globalViewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, filterType, filters);
    },
    [globalViewId, workspaceSlug, issuesFilter]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      createIssue,
      updateIssue,
      removeIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, createIssue, updateIssue, removeIssue, updateFilters]
  );
};
