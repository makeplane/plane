import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
import { DraftIssueAppliedFiltersRoot } from "../filters/applied-filters/roots/draft-issue";
import { DraftIssueListLayout } from "../list/roots/draft-issue-root";
import { Spinner } from "@plane/ui";
import { DraftKanBanLayout } from "../kanban/roots/draft-issue-root";
import { EIssuesStoreType } from "constants/issue";

export const DraftIssueLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.DRAFT);

  useSWR(workspaceSlug && projectId ? `DRAFT_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await fetchFilters(workspaceSlug, projectId);
      await fetchIssues(workspaceSlug, projectId, groupedIssueIds ? "mutation" : "init-loader");
    }
  });

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <DraftIssueAppliedFiltersRoot />

      {loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="relative h-full w-full overflow-auto">
            {activeLayout === "list" ? (
              <DraftIssueListLayout />
            ) : activeLayout === "kanban" ? (
              <DraftKanBanLayout />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
});
