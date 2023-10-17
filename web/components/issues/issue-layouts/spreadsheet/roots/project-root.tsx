import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/issues";
// types
import { IIssueDisplayFilterOptions } from "types";
// constants
import { IIssueUnGroupedStructure } from "store/issue";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issue: issueStore, issueFilter: issueFilterStore, project: projectStore } = useMobxStore();

  const issues = issueStore.getIssues;

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
      handleUpdateIssue={(issueId, data) => {
        console.log(issueId, data);
      }}
      disableUserActions={false}
    />
  );
});
