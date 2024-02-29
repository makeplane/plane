import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useUser } from "hooks/store";
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
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as { workspaceSlug: string; userId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROFILE);

  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue, userId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id, userId);
      },
      [EIssueActions.ARCHIVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.archiveIssue(workspaceSlug, issue.project_id, issue.id, userId);
      },
    }),
    [issues, workspaceSlug, userId]
  );

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!userId) return;
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, userId.toString());
    },
    [userId, issuesFilter.updateFilters]
  );

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!userId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, payload, userId.toString());
    },
    [issues.updateIssue, userId]
  );

  const removeIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string) => {
      if (!userId) return;
      return await issues.removeIssue(workspaceSlug, projectId, issueId, userId.toString());
    },
    [issues.removeIssue, userId]
  );

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilter={issuesFilter}
      issues={issues}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROFILE}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      updateFilters={updateFilters}
      removeIssue={removeIssue}
      updateIssue={updateIssue}
    />
  );
});
