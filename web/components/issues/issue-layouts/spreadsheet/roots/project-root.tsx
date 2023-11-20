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
    projectIssuesFilter: projectIssueFiltersStore,
    issueDetail: issueDetailStore,
    projectLabel: { projectLabels },
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

  const handleIssueAction = async (issue: IIssue, action: "copy" | "delete" | "edit") => {
    if (!workspaceSlug || !projectId || !user) return;

    if (action === "delete") {
      issueDetailStore.deleteIssue(workspaceSlug.toString(), projectId.toString(), issue.id);
      // issueStore.removeIssueFromStructure(null, null, issue);
    } else if (action === "edit") {
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, issue);
      // issueStore.updateIssueStructure(null, null, issue);
    }
  };

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
      displayProperties={projectIssueFiltersStore.issueFilters?.displayProperties ?? {}}
      displayFilters={projectIssueFiltersStore.issueFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      members={projectMembers?.map((m) => m.member)}
      labels={projectLabels || undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={handleIssueAction}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
      enableQuickCreateIssue
    />
  );
});
