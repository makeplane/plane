import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
// components
import { ArchivedIssueListLayout, ArchivedIssueAppliedFiltersRoot } from "components/issues";
import { EIssuesStoreType } from "constants/issue";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    issues: { groupedIssueIds, fetchIssues },
    issuesFilter: { fetchFilters },
  } = useIssues(EIssuesStoreType.ARCHIVED);

  useSWR(workspaceSlug && projectId ? `ARCHIVED_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await fetchFilters(workspaceSlug, projectId);
      await fetchIssues(workspaceSlug, projectId, groupedIssueIds ? "mutation" : "init-loader");
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
