import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hoks
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
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue, moduleId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id, moduleId);
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.removeIssueFromModule(workspaceSlug, issue.project_id, moduleId, issue.id);
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

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId}
      updateFilters={updateFilters}
      updateIssue={updateIssue}
    />
  );
});
