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
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    projectArchivedIssues: { getIssues, fetchIssues },
    projectArchivedIssuesFilter: { fetchFilters },
  } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `ARCHIVED_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await fetchFilters(workspaceSlug, projectId);
      await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader");
    }
  });

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ArchivedIssueAppliedFiltersRoot />
      <div className="h-full w-full overflow-auto">
        <ArchivedIssueListLayout />
      </div>
    </div>
  );
});
