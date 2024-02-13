import { EIssuesStoreType } from "constants/issue";
import { useApplication, useIssues } from "./store";
import { TIssue, TLoader } from "@plane/types";

export const useIssuesActions = (storeType: EIssuesStoreType) => {
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: moduleIssues } = useIssues(EIssuesStoreType.MODULE);
  const { issues: cycleIssues } = useIssues(EIssuesStoreType.CYCLE);
  const { issues: viewIssues } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { issues: profileIssues } = useIssues(EIssuesStoreType.PROFILE);

  const {
    router: { cycleId, moduleId, userId, viewId },
  } = useApplication();

  switch (storeType) {
    case EIssuesStoreType.PROJECT_VIEW:
      return {
        fetchIssues: async (workspaceSlug: string, projectId: string, loadType: TLoader) => {
          if (!viewId) return;
          return await viewIssues.fetchIssues(workspaceSlug, projectId, loadType, viewId);
        },
        createIssue: async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
          if (!viewId) return;
          return await viewIssues.createIssue(workspaceSlug, projectId, data, viewId);
        },
        updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
          if (!viewId) return;
          return await viewIssues.updateIssue(workspaceSlug, projectId, issueId, data, viewId);
        },
      };
    case EIssuesStoreType.PROFILE:
      return {
        fetchIssues: async (workspaceSlug: string, projectId: string, loadType: TLoader) => {
          if (!userId) return;
          return await profileIssues.fetchIssues(workspaceSlug, projectId, loadType, userId);
        },
        createIssue: async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
          if (!userId) return;
          return await profileIssues.createIssue(workspaceSlug, projectId, data, userId);
        },
        updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
          if (!userId) return;
          return await profileIssues.updateIssue(workspaceSlug, projectId, issueId, data, userId);
        },
      };
    case EIssuesStoreType.CYCLE:
      return {
        fetchIssues: async (workspaceSlug: string, projectId: string, loadType: TLoader) => {
          if (!cycleId) return;
          return await cycleIssues.fetchIssues(workspaceSlug, projectId, loadType, cycleId);
        },
        createIssue: async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
          if (!cycleId) return;
          return await cycleIssues.createIssue(workspaceSlug, projectId, data, cycleId);
        },
        updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
          if (!cycleId) return;
          return await cycleIssues.updateIssue(workspaceSlug, projectId, issueId, data, cycleId);
        },
      };
    case EIssuesStoreType.MODULE:
      return {
        fetchIssues: async (workspaceSlug: string, projectId: string, loadType: TLoader) => {
          if (!moduleId) return;
          return await moduleIssues.fetchIssues(workspaceSlug, projectId, loadType, moduleId);
        },
        createIssue: async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
          if (!moduleId) return;
          return await moduleIssues.createIssue(workspaceSlug, projectId, data, moduleId);
        },
        updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
          if (!moduleId) return;
          return await moduleIssues.updateIssue(workspaceSlug, projectId, issueId, data, moduleId);
        },
      };
    case EIssuesStoreType.PROJECT:
    default:
      return {
        fetchIssues: async (workspaceSlug: string, projectId: string, loadType: TLoader) =>
          await projectIssues.fetchIssues(workspaceSlug, projectId, loadType),
        createIssue: async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) =>
          await projectIssues.createIssue(workspaceSlug, projectId, data),
        updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
          await projectIssues.updateIssue(workspaceSlug, projectId, issueId, data),
      };
  }
};
