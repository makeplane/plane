import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useIssues } from "hooks/store";
// components
import { DraftIssueAppliedFiltersRoot } from "../filters/applied-filters/roots/draft-issue";
import { DraftIssueListLayout } from "../list/roots/draft-issue-root";
import { ProjectDraftEmptyState } from "../empty-states";
import { IssuePeekOverview } from "components/issues/peek-overview";
import { ActiveLoader } from "components/ui";
// ui
import { Spinner } from "@plane/ui";
import { DraftKanBanLayout } from "../kanban/roots/draft-issue-root";
// constants
import { EIssuesStoreType } from "constants/issue";

export const DraftIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  useSWR(
    workspaceSlug && projectId ? `DRAFT_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
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

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout || undefined;

  if (!workspaceSlug || !projectId) return <></>;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return (
      <>
        {activeLayout ? (
          <ActiveLoader layout={activeLayout} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </>
    );
  }

  if (issues?.groupedIssueIds?.length === 0) {
    return (
      <div className="relative h-full w-full overflow-y-auto">
        <ProjectDraftEmptyState />
      </div>
    );
  }
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <DraftIssueAppliedFiltersRoot />

      <div className="relative h-full w-full overflow-auto">
        {activeLayout === "list" ? <DraftIssueListLayout /> : activeLayout === "kanban" ? <DraftKanBanLayout /> : null}
        {/* issue peek overview */}
        <IssuePeekOverview />
      </div>
    </div>
  );
});
