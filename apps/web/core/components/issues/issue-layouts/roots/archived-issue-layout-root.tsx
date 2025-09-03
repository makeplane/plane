import { Fragment } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EIssuesStoreType } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// local imports
import { IssuePeekOverview } from "../../peek-overview";
import { ArchivedIssueAppliedFiltersRoot } from "../filters";
import { ArchivedIssueListLayout } from "../list/roots/archived-issue-root";

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
