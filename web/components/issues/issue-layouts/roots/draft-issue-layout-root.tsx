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
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <DraftIssueAppliedFiltersRoot />

      {issues?.loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {!issues?.groupedIssueIds ? (
            <ProjectDraftEmptyState />
          ) : (
            <div className="relative h-full w-full overflow-auto">
              {activeLayout === "list" ? (
                <DraftIssueListLayout />
              ) : activeLayout === "kanban" ? (
                <DraftKanBanLayout />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
});
