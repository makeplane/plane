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

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueFilter: issueFilterStore,
    moduleIssue: moduleIssueStore,
    issueDetail: issueDetailStore,
    project: projectStore,
    projectState: projectStateStore,
  } = useMobxStore();

  const issues = moduleIssueStore.getIssues;

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
      if (!workspaceSlug || !projectId) return;

      const payload = {
        ...issue,
        ...data,
      };

      moduleIssueStore.updateIssueStructure(null, null, payload);
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, data);
    },
    [issueDetailStore, moduleIssueStore, projectId, workspaceSlug]
  );

  return (
    <SpreadsheetView
      displayProperties={issueFilterStore.userDisplayProperties}
      displayFilters={issueFilterStore.userDisplayFilters}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      members={projectId ? projectStore.members?.[projectId.toString()]?.map((m) => m.member) : undefined}
      labels={projectId ? projectStore.labels?.[projectId.toString()] ?? undefined : undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={() => {}}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
    />
  );
});
