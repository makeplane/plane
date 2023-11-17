import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/issues";
// types
import { IIssue, IIssueDisplayFilterOptions, TUnGroupedIssues } from "types";
// constants
import { IIssueUnGroupedStructure } from "store/issue";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    projectIssues: projectIssuesStore,
    projectIssueFilters: projectIssueFiltersStore,
    issueDetail: issueDetailStore,
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;

  const issuesResponse = projectIssuesStore.getIssues;
  const issueIds = (projectIssuesStore.getIssuesIds ?? []) as TUnGroupedIssues;

  const issues = issueIds?.map((id) => issuesResponse?.[id]);

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      projectIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [projectIssueFiltersStore, projectId, workspaceSlug]
  );

  const handleUpdateIssue = useCallback(
    (issue: IIssue, data: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !user) return;

      const payload = {
        ...issue,
        ...data,
      };

      // TODO: add update logic from the new store
      // issueStore.updateIssueStructure(null, null, payload);
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, data);
    },
    [issueDetailStore, projectId, user, workspaceSlug]
  );

  return (
    <SpreadsheetView
      displayProperties={projectIssueFiltersStore.projectFilters?.displayProperties ?? {}}
      displayFilters={projectIssueFiltersStore.projectFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      members={projectMembers?.map((m) => m.member)}
      labels={projectId ? projectStore.labels?.[projectId.toString()] ?? undefined : undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={() => {}}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
      enableQuickCreateIssue
    />
  );
});
