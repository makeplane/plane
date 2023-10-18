import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/issues";
// types
import { IIssue, IIssueDisplayFilterOptions } from "types";
// constants
import { IIssueUnGroupedStructure } from "store/issue";

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueFilter: issueFilterStore,
    projectViewIssues: projectViewIssueStore,
    issueDetail: issueDetailStore,
    project: projectStore,
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;
  const issues = projectViewIssueStore.getIssues;

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleUpdateIssue = useCallback(
    (issue: IIssue, data: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !user) return;

      const payload = {
        ...issue,
        ...data,
      };

      projectViewIssueStore.updateIssueStructure(null, null, payload);
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, data, user);
    },
    [issueDetailStore, projectViewIssueStore, projectId, user, workspaceSlug]
  );

  return (
    <SpreadsheetView
      displayProperties={issueFilterStore.userDisplayProperties}
      displayFilters={issueFilterStore.userDisplayFilters}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      members={projectId ? projectStore.members?.[projectId.toString()]?.map((m) => m.member) : undefined}
      labels={projectId ? projectStore.labels?.[projectId.toString()] ?? undefined : undefined}
      states={projectId ? projectStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={() => {}}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
    />
  );
});
