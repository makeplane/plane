import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hook
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
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

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, moduleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, moduleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project_id, moduleId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, moduleId]
  );

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!moduleId) return;
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, moduleId.toString());
    },
    [moduleId, issuesFilter.updateFilters]
  );

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!moduleId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, payload, moduleId.toString());
    },
    [issues.updateIssue, moduleId]
  );

  const removeIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string) => {
      if (!moduleId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, moduleId.toString());
    },
    [issues.removeIssue, moduleId]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId?.toString()}
      storeType={EIssuesStoreType.MODULE}
      updateFilters={updateFilters}
      removeIssue={removeIssue}
      updateIssue={updateIssue}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
    />
  );
});
