import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
// components
import {
  ArchivedIssueListLayout,
  ArchivedIssueAppliedFiltersRoot,
  ProjectArchivedEmptyState,
  IssuePeekOverview,
} from "components/issues";
import { EIssuesStoreType } from "constants/issue";
// ui
import { ListLayoutLoader } from "components/ui";

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
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader"
        );
      }
    }
  );

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <ListLayoutLoader />;
  }

  if (issues?.groupedIssueIds?.length === 0) {
    return (
      <div className="relative h-full w-full overflow-y-auto">
        <ProjectArchivedEmptyState />
      </div>
    );
  }

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
