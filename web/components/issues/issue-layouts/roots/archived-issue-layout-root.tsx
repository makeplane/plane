import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ArchivedIssueListLayout, ArchivedIssueAppliedFiltersRoot } from "components/issues";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { archivedIssueFilters: archivedIssueFiltersStore, archivedIssues: archivedIssueStore } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `ARCHIVED_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await archivedIssueFiltersStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());
      await archivedIssueStore.fetchIssues(workspaceSlug.toString(), projectId.toString());
    }
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ArchivedIssueAppliedFiltersRoot />
      <div className="w-full h-full overflow-auto">
        <ArchivedIssueListLayout />
      </div>
    </div>
  );
});
