import React, { Fragment } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
// components
import { ArchivedIssueListLayout, ArchivedIssueAppliedFiltersRoot, IssuePeekOverview } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
// ui
import { useIssues } from "hooks/store";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ArchivedIssueAppliedFiltersRoot />
      <div className="relative h-full w-full overflow-auto">
        <ArchivedIssueListLayout />
      </div>
      <IssuePeekOverview is_archived />
    </div>
  );
});
