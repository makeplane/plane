import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// mobx store
// components
import { ArchivedIssueListLayout, ArchivedIssueAppliedFiltersRoot, IssuePeekOverview } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// ui
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

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
    <IssuesStoreContext.Provider value={EIssuesStoreType.ARCHIVED}>
      <ArchivedIssueAppliedFiltersRoot />
      <Fragment>
        <div className="relative h-full w-full overflow-auto">
          <ArchivedIssueListLayout />
        </div>
        <IssuePeekOverview is_archived />
      </Fragment>
    </IssuesStoreContext.Provider>
  );
});
