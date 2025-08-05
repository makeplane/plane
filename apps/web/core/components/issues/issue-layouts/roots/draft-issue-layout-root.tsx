import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// components
import { DraftIssueAppliedFiltersRoot } from "../filters/applied-filters/roots/draft-issue";
import { DraftKanBanLayout } from "../kanban/roots/draft-issue-root";
import { DraftIssueListLayout } from "../list/roots/draft-issue-root";
// ui
// constants

const DraftIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <DraftIssueListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <DraftKanBanLayout />;
    default:
      return null;
  }
};
export const DraftIssueLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `DRAFT_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueFilters = issuesFilter?.getIssueFilters(projectId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  if (!workspaceSlug || !projectId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.DRAFT}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <DraftIssueAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto">
          <DraftIssueLayout activeLayout={activeLayout} />
          {/* issue peek overview */}
          <IssuePeekOverview is_draft />
        </div>
      </div>
    </IssuesStoreContext.Provider>
  );
});
