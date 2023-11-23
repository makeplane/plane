import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { DraftIssueAppliedFiltersRoot } from "../filters/applied-filters/roots/draft-issue";
import { DraftIssueListLayout } from "../list/roots/draft-issue-root";

export const DraftIssueLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    projectDraftIssuesFilter: { fetchFilters },
    projectDraftIssues: { getIssues, fetchIssues },
  } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `DRAFT_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await fetchFilters(workspaceSlug, projectId);
      await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader");
    }
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <DraftIssueAppliedFiltersRoot />
      <div className="w-full h-full overflow-auto">
        <DraftIssueListLayout />
      </div>
    </div>
  );
});
