import { useCallback, useMemo } from "react";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
  TLoader,
} from "@plane/types";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useAppRouter, useIssues } from "./store";

interface IssueActions {
  fetchIssues?: (projectId: string, loadType: TLoader) => Promise<TIssue[] | undefined>;
  removeIssue: (projectId: string, issueId: string) => Promise<void>;
  createIssue?: (projectId: string, data: Partial<TIssue>) => Promise<TIssue | undefined>;
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssueFromView?: (projectId: string, issueId: string) => Promise<void>;
  archiveIssue?: (projectId: string, issueId: string) => Promise<void>;
  restoreIssue?: (projectId: string, issueId: string) => Promise<void>;
  updateFilters: (
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>;
}

export const useIssuesActions = (storeType: EIssuesStoreType): IssueActions => {
  const projectIssueActions = useProjectIssueActions();
  const cycleIssueActions = useCycleIssueActions();
  const moduleIssueActions = useModuleIssueActions();
  const profileIssueActions = useProfileIssueActions();
  const projectViewIssueActions = useProjectViewIssueActions();
  const draftIssueActions = useDraftIssueActions();
  const archivedIssueActions = useArchivedIssueActions();
  const globalIssueActions = useGlobalIssueActions();

  switch (storeType) {
    case EIssuesStoreType.PROJECT_VIEW:
      return projectViewIssueActions;
    case EIssuesStoreType.PROFILE:
      return profileIssueActions;
    case EIssuesStoreType.CYCLE:
      return cycleIssueActions;
    case EIssuesStoreType.MODULE:
      return moduleIssueActions;
    case EIssuesStoreType.ARCHIVED:
      return archivedIssueActions;
    case EIssuesStoreType.DRAFT:
      return draftIssueActions;
    case EIssuesStoreType.GLOBAL:
      return globalIssueActions;
    case EIssuesStoreType.PROJECT:
    default:
      return projectIssueActions;
  }
};

const useProjectIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const { workspaceSlug } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType);
    },
    [issues.fetchIssues, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
    },
    [issues.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data);
    },
    [issues.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!workspaceSlug) return;
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
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      createIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, createIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useCycleIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { workspaceSlug, cycleId } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType, cycleId);
    },
    [issues.fetchIssues, cycleId, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data, cycleId);
    },
    [issues.createIssue, cycleId, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, cycleId);
    },
    [issues.updateIssue, cycleId, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, cycleId);
    },
    [issues.removeIssue, cycleId, workspaceSlug]
  );
  const removeIssueFromView = useCallback(
    async (projectId: string, issueId: string) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
    },
    [issues.removeIssueFromCycle, cycleId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!cycleId || !workspaceSlug) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId, cycleId);
    },
    [issues.archiveIssue, cycleId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!cycleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, cycleId);
    },
    [issuesFilter.updateFilters, cycleId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      createIssue,
      updateIssue,
      removeIssue,
      removeIssueFromView,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, createIssue, updateIssue, removeIssue, removeIssueFromView, archiveIssue, updateFilters]
  );
};

const useModuleIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const { workspaceSlug, moduleId } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType, moduleId);
    },
    [issues.fetchIssues, moduleId, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data, moduleId);
    },
    [issues.createIssue, moduleId, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, moduleId);
    },
    [issues.updateIssue, moduleId, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, moduleId);
    },
    [issues.removeIssue, moduleId, workspaceSlug]
  );
  const removeIssueFromView = useCallback(
    async (projectId: string, issueId: string) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.removeIssuesFromModule(workspaceSlug, projectId, moduleId, [issueId]);
    },
    [issues.removeIssuesFromModule, moduleId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!moduleId || !workspaceSlug) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId, moduleId);
    },
    [issues.archiveIssue, moduleId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!moduleId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, moduleId);
    },
    [issuesFilter.updateFilters, moduleId]
  );

  return useMemo(
    () => ({
      fetchIssues,
      createIssue,
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
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROFILE);

  const { workspaceSlug, userId } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!userId || !workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType, userId);
    },
    [issues.fetchIssues, userId, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!userId || !workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data, userId);
    },
    [issues.createIssue, userId, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!userId || !workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, userId);
    },
    [issues.updateIssue, userId, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!userId || !workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, userId);
    },
    [issues.removeIssue, userId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!userId || !workspaceSlug) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId, userId);
    },
    [issues.archiveIssue, userId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!userId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, userId);
    },
    [issuesFilter.updateFilters, userId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
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
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  const { workspaceSlug, viewId } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!viewId || !workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType, viewId);
    },
    [issues.fetchIssues, viewId, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!viewId || !workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data, viewId);
    },
    [issues.createIssue, viewId, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!viewId || !workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, viewId);
    },
    [issues.updateIssue, viewId, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!viewId || !workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, viewId);
    },
    [issues.removeIssue, viewId, workspaceSlug]
  );
  const archiveIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!viewId || !workspaceSlug) return;
      return await issues.archiveIssue(workspaceSlug, projectId, issueId, viewId);
    },
    [issues.archiveIssue, viewId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!viewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, viewId);
    },
    [issuesFilter.updateFilters, viewId, workspaceSlug]
  );

  return useMemo(
    () => ({
      fetchIssues,
      createIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      updateFilters,
    }),
    [fetchIssues, createIssue, updateIssue, removeIssue, archiveIssue, updateFilters]
  );
};

const useDraftIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  const { workspaceSlug } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType);
    },
    [issues.fetchIssues, workspaceSlug]
  );
  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data);
    },
    [issues.createIssue, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data);
    },
    [issues.updateIssue, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters]
  );

  return useMemo(
    () => ({
      fetchIssues,
      createIssue,
      updateIssue,
      removeIssue,
      updateFilters,
    }),
    [fetchIssues, createIssue, updateIssue, removeIssue, updateFilters]
  );
};

const useArchivedIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const { workspaceSlug } = useAppRouter();

  const fetchIssues = useCallback(
    async (projectId: string, loadType: TLoader) => {
      if (!workspaceSlug) return;
      return await issues.fetchIssues(workspaceSlug, projectId, loadType);
    },
    [issues.fetchIssues]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId);
    },
    [issues.removeIssue]
  );
  const restoreIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!workspaceSlug) return;
      return await issues.restoreIssue(workspaceSlug, projectId, issueId);
    },
    [issues.restoreIssue]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters);
    },
    [issuesFilter.updateFilters]
  );

  return useMemo(
    () => ({
      fetchIssues,
      removeIssue,
      restoreIssue,
      updateFilters,
    }),
    [fetchIssues, removeIssue, restoreIssue, updateFilters]
  );
};

const useGlobalIssueActions = () => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.GLOBAL);

  const { workspaceSlug, globalViewId } = useAppRouter();

  const createIssue = useCallback(
    async (projectId: string, data: Partial<TIssue>) => {
      if (!globalViewId || !workspaceSlug) return;
      return await issues.createIssue(workspaceSlug, projectId, data, globalViewId);
    },
    [issues.createIssue, globalViewId, workspaceSlug]
  );
  const updateIssue = useCallback(
    async (projectId: string, issueId: string, data: Partial<TIssue>) => {
      if (!globalViewId || !workspaceSlug) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, data, globalViewId);
    },
    [issues.updateIssue, globalViewId, workspaceSlug]
  );
  const removeIssue = useCallback(
    async (projectId: string, issueId: string) => {
      if (!globalViewId || !workspaceSlug) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, globalViewId);
    },
    [issues.removeIssue, globalViewId, workspaceSlug]
  );

  const updateFilters = useCallback(
    async (
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!globalViewId || !workspaceSlug) return;
      return await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, globalViewId);
    },
    [issuesFilter.updateFilters, globalViewId, workspaceSlug]
  );

  return useMemo(
    () => ({
      createIssue,
      updateIssue,
      removeIssue,
      updateFilters,
    }),
    [createIssue, updateIssue, removeIssue, updateFilters]
  );
};
