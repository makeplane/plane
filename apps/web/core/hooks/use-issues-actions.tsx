/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

/* oxlint-disable react-hooks/exhaustive-deps */
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
// local imports
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
  updateIssue?: (
    projectId: string | undefined | null,
    issueId: string,
    data: Partial<TIssue>,
    shouldSync?: boolean
  ) => Promise<void>;
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
  const teamWorkItemActions = useTeamWorkItemActions();
  const projectIssueActions = useProjectIssueActions();
  const projectEpicsActions = useProjectEpicsActions();
  const initiativeEpicsActions = useInitiativeEpicsActions();
  const cycleIssueActions = useCycleIssueActions();
  const moduleIssueActions = useModuleIssueActions();
  const teamViewWorkItemActions = useTeamViewWorkItemActions();
  const projectViewIssueActions = useProjectViewIssueActions();
  const globalIssueActions = useGlobalIssueActions();
  const profileIssueActions = useProfileIssueActions();
  const archivedIssueActions = useArchivedIssueActions();
  const archivedEpicsActions = useArchivedEpicsActions();
  const workspaceDraftIssueActions = useWorkspaceDraftIssueActions();
  const teamProjectWorkItemsActions = useTeamProjectWorkItemsActions();
  const releaseWorkItemActions = useReleaseWorkItemsActions();

  switch (storeType) {
    case EIssuesStoreType.TEAM_VIEW:
      return teamViewWorkItemActions;
    case EIssuesStoreType.PROJECT_VIEW:
      return projectViewIssueActions;
    case EIssuesStoreType.PROFILE:
      return profileIssueActions;
    case EIssuesStoreType.TEAM:
      return teamWorkItemActions;
    case EIssuesStoreType.ARCHIVED:
      return archivedIssueActions;
    case EIssuesStoreType.ARCHIVED_EPIC:
      return archivedEpicsActions;
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
    case EIssuesStoreType.INITIATIVE_EPIC:
      return initiativeEpicsActions;
    case EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS:
      return teamProjectWorkItemsActions;
    case EIssuesStoreType.RELEASE:
      return releaseWorkItemActions;
    case EIssuesStoreType.PROJECT:
    default:
      return projectIssueActions;
  }
};

const useProjectIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), projectId.toString(), groupId, subGroupId);
    },
    [issues.fetchNextIssues, workspaceSlug, projectId]
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
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
  const projectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.EPIC);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), projectId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
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
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
    async (_projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
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

const useInitiativeEpicsActions = (): IssueActions => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, initiativeId: routerInitiativeId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const initiativeId = routerInitiativeId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.INITIATIVE_EPIC);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !initiativeId) return;
      return issues.fetchIssues(workspaceSlug, initiativeId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, initiativeId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !initiativeId) return;
      return issues.fetchNextIssues(workspaceSlug, initiativeId, groupId, subGroupId);
    },
    [issues.fetchNextIssues, workspaceSlug, initiativeId]
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
    async (_projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!workspaceSlug || !initiativeId) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      issuesFilter.updateEpicFilters(workspaceSlug, filterType, filters as any, initiativeId);
    },
    [issuesFilter.updateEpicFilters, workspaceSlug, initiativeId]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      updateIssue,
      removeIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, updateIssue, removeIssue, updateFilters]
  );
};

const useCycleIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, cycleId: routerCycleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  const cycleId = routerCycleId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, cycleId?: string) => {
      if (!workspaceSlug || !projectId || !cycleId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options, cycleId.toString());
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId || !cycleId) return;
      return issues.fetchNextIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        cycleId.toString(),
        groupId,
        subGroupId
      );
    },
    [issues.fetchIssues, workspaceSlug, projectId, cycleId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!cycleId || !workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, cycleId);
    },
    [issues.createIssue, cycleId, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!cycleId || !workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data, cycleId);
    },
    [issues.quickAddIssue, workspaceSlug, cycleId]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
      if (!cycleId || !workspaceSlug || !projectId) return;
      return await issues.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
    },
    [issues.removeIssueFromCycle, cycleId, workspaceSlug]
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
      if (!cycleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, cycleId);
    },
    [issuesFilter.updateFilters, cycleId, workspaceSlug]
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
  const projectId = routerProjectId?.toString();
  const moduleId = routerModuleId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, moduleId?: string) => {
      if (!workspaceSlug || !projectId || !moduleId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options, moduleId.toString());
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId || !moduleId) return;
      return issues.fetchNextIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        moduleId.toString(),
        groupId,
        subGroupId
      );
    },
    [issues.fetchIssues, workspaceSlug, projectId, moduleId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!moduleId || !workspaceSlug || !projectId) return;
      return await issues.createIssue(workspaceSlug, projectId, data, moduleId);
    },
    [issues.createIssue, moduleId, workspaceSlug]
  );
  const quickAddIssue = useCallback(
    async (projectId: string | undefined | null, data: TIssue) => {
      if (!moduleId || !workspaceSlug || !projectId) return;
      return await issues.quickAddIssue(workspaceSlug, projectId, data, moduleId);
    },
    [issues.quickAddIssue, workspaceSlug, moduleId]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
      if (!moduleId || !workspaceSlug || !projectId) return;
      return await issues.removeIssuesFromModule(workspaceSlug, projectId, moduleId, [issueId]);
    },
    [issues.removeIssuesFromModule, moduleId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [issues.archiveIssue, moduleId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!moduleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, moduleId);
    },
    [issuesFilter.updateFilters, moduleId]
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
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
  const projectId = routerProjectId?.toString();
  const viewId = routerViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), viewId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), projectId.toString(), viewId, groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
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
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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
      if (!viewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, viewId);
    },
    [issuesFilter.updateFilters, viewId, workspaceSlug]
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
  const projectId = routerProjectId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), projectId.toString(), groupId, subGroupId);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
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

const useArchivedEpicsActions = () => {
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED_EPIC);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchIssues(workspaceSlug.toString(), projectId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !projectId) return;
      return issues.fetchNextIssues(workspaceSlug.toString(), projectId.toString(), groupId, subGroupId);
    },
    [issues.fetchNextIssues, workspaceSlug, projectId]
  );

  const removeIssue = useCallback(
    async (projectId: string | undefined | null, epicId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeIssue(workspaceSlug, projectId, epicId);
    },
    [issues.removeIssue]
  );
  const restoreIssue = useCallback(
    async (projectId: string | undefined | null, epicId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.restoreIssue(workspaceSlug, projectId, epicId);
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

const useReleaseWorkItemsActions = () => {
  const { workspaceSlug: routerWorkspaceSlug, releaseId: routerReleaseId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.RELEASE);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      const releaseId = viewId ?? routerReleaseId?.toString();
      if (!workspaceSlug || !releaseId) return undefined;
      return issues.fetchIssues(workspaceSlug, releaseId, loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, routerReleaseId]
  );

  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      const releaseId = routerReleaseId?.toString();
      if (!workspaceSlug || !releaseId) return undefined;
      return issues.fetchNextIssues(workspaceSlug, releaseId, groupId, subGroupId);
    },
    [issues.fetchNextIssues, workspaceSlug, routerReleaseId]
  );

  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug) return;
      return issues.removeIssue(workspaceSlug, projectId ?? "", issueId);
    },
    [issues.removeIssue, workspaceSlug]
  );

  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
    },
    [issues.updateIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      return issuesFilter.updateFilters(projectId, filterType, filters);
    },
    [issuesFilter.updateFilters]
  );

  return useMemo(
    () => ({
      fetchIssues,
      fetchNextIssues,
      removeIssue,
      updateIssue,
      updateFilters,
    }),
    [fetchIssues, fetchNextIssues, removeIssue, updateIssue, updateFilters]
  );
};

const useGlobalIssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, globalViewId: routerGlobalViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const globalViewId = routerGlobalViewId?.toString();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.GLOBAL);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !globalViewId) return;
      return issues.fetchIssues(workspaceSlug.toString(), globalViewId.toString(), loadType, options);
    },
    [issues.fetchIssues, workspaceSlug, globalViewId]
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
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
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

export const useTeamWorkItemActions: () => IssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  // store hooks
  const { issues: workItems, issuesFilter: workItemsFilter } = useIssues(EIssuesStoreType.TEAM);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !teamspaceId) return;
      return workItems.fetchIssues(workspaceSlug, teamspaceId, loadType, options);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId) return;
      return workItems.fetchNextIssues(workspaceSlug.toString(), teamspaceId.toString(), groupId, subGroupId);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.createIssue(workspaceSlug, projectId, data, teamspaceId);
    },
    [workItems.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
    },
    [workItems.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.removeIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (_projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!workspaceSlug) return;
      return await workItemsFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters);
    },
    [workItemsFilter.updateFilters, teamspaceId, workspaceSlug]
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

export const useTeamViewWorkItemActions: () => IssueActions = () => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  const viewId = routerViewId?.toString();
  // store hooks
  const { issues: workItems, issuesFilter: workItemsFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions, viewId?: string) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      return workItems.fetchIssues(workspaceSlug, teamspaceId, viewId, loadType, options);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId, viewId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      return workItems.fetchNextIssues(workspaceSlug, teamspaceId, viewId, groupId, subGroupId);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId, viewId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !teamspaceId) return;
      return await workItems.createIssue(workspaceSlug, projectId, data, teamspaceId);
    },
    [workItems.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
    },
    [workItems.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.removeIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (_projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!viewId || !workspaceSlug) return;
      return await workItemsFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters, viewId);
    },
    [workItemsFilter.updateFilters, viewId, teamspaceId, workspaceSlug]
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
  const { issues: workItems, issuesFilter: workItemsFilter } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);

  const fetchIssues = useCallback(
    async (loadType: TLoader, options: IssuePaginationOptions) => {
      if (!workspaceSlug || !teamspaceId || !projectId) return;
      return workItems.fetchIssues(workspaceSlug, teamspaceId, projectId, loadType, options);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId, projectId]
  );
  const fetchNextIssues = useCallback(
    async (groupId?: string, subGroupId?: string) => {
      if (!workspaceSlug || !teamspaceId || !projectId) return;
      return workItems.fetchNextIssues(workspaceSlug, teamspaceId, projectId, groupId, subGroupId);
    },
    [workItems.fetchIssues, workspaceSlug, teamspaceId, projectId]
  );

  const createIssue = useCallback(
    async (projectId: string | undefined | null, data: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !teamspaceId) return;
      return await workItems.createIssue(workspaceSlug, projectId, data, teamspaceId);
    },
    [workItems.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string, data: Partial<TIssue>, shouldSync?: boolean) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.updateIssue(workspaceSlug, projectId, issueId, data, shouldSync);
    },
    [workItems.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.removeIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string | undefined | null, issueId: string) => {
      if (!workspaceSlug || !projectId) return;
      return await workItems.archiveIssue(workspaceSlug, projectId, issueId);
    },
    [workItems.archiveIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (projectId: string, filterType: TSupportedFilterTypeForUpdate, filters: TSupportedFilterForUpdate) => {
      if (!projectId || !workspaceSlug) return;
      return await workItemsFilter.updateFilters(workspaceSlug, teamspaceId, filterType, filters, projectId);
    },
    [workItemsFilter.updateFilters, projectId, teamspaceId, workspaceSlug]
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
