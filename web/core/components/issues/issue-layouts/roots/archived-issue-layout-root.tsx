import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EIssuesStoreType } from "@plane/types";
// mobx store
// components
import { LogoSpinner } from "@/components/common";
import { ArchivedIssueListLayout, ArchivedIssueAppliedFiltersRoot, IssuePeekOverview } from "@/components/issues";
// ui
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

export const ArchivedIssueLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `ARCHIVED_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueFilters = issuesFilter?.getIssueFilters(projectId?.toString());

  if (!workspaceSlug || !projectId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.ARCHIVED}>
      <ArchivedIssueAppliedFiltersRoot />
      <Fragment>
        <div className="relative h-full w-full overflow-auto">
          <ArchivedIssueListLayout />
        </div>
        <IssuePeekOverview />
      </Fragment>
    </IssuesStoreContext.Provider>
  );
});
