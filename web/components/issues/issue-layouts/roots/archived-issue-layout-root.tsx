import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
// components
import {
  ArchivedIssueListLayout,
  ArchivedIssueAppliedFiltersRoot,
  ProjectArchivedEmptyState,
  IssuePeekOverview,
} from "@/components/issues";
import { ListLayoutLoader } from "@/components/ui";
// constants
import { E_ARCHIVE } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
// ui
import { useIssues, useEventTracker } from "@/hooks/store";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  const { captureIssuesListOpenedEvent } = useEventTracker();

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
        captureIssuesListOpenedEvent({
          filters: issuesFilter?.issueFilters,
          element: E_ARCHIVE,
          elementId: projectId.toString(),
        });
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader"
        );
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <ListLayoutLoader />;
  }

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <ArchivedIssueAppliedFiltersRoot />
      {issues?.groupedIssueIds?.length === 0 ? (
        <div className="relative h-full w-full overflow-y-auto">
          <ProjectArchivedEmptyState />
        </div>
      ) : (
        <Fragment>
          <div className="relative h-full w-full overflow-auto">
            <ArchivedIssueListLayout />
          </div>
          <IssuePeekOverview is_archived issuesFilter={issuesFilter.issueFilters} />
        </Fragment>
      )}
    </>
  );
});
