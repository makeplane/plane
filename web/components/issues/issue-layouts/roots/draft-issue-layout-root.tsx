import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DraftIssueListLayout, DraftIssueKanBanLayout, ProjectDraftIssueAppliedFiltersRoot } from "components/issues";

export const DraftIssueLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { draftIssues: draftIssuesStore, draftIssueFilters: draftIssueFiltersStore } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `PROJECT_FILTERS_AND_ISSUES_${projectId.toString()}` : null, async () => {
    if (workspaceSlug && projectId) {
      await draftIssueFiltersStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());
      await draftIssuesStore.fetchIssues(workspaceSlug.toString(), projectId.toString());
    }
  });

  const activeLayout = draftIssueFiltersStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ProjectDraftIssueAppliedFiltersRoot />
      <div className="w-full h-full overflow-auto">
        {activeLayout === "list" ? (
          <DraftIssueListLayout />
        ) : activeLayout === "kanban" ? (
          <DraftIssueKanBanLayout />
        ) : null}
      </div>
    </div>
  );
});
