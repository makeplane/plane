import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useIssues } from "hooks/store";
// components
import {
  ModuleAppliedFiltersRoot,
  ModuleCalendarLayout,
  ModuleEmptyState,
  ModuleGanttLayout,
  ModuleKanBanLayout,
  ModuleListLayout,
  ModuleSpreadsheetLayout,
} from "components/issues";
// ui
import { Spinner } from "@plane/ui";
import { EIssuesStoreType } from "constants/issue";

export const ModuleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const {
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.MODULE);

  useSWR(
    workspaceSlug && projectId && moduleId ? `MODULE_ISSUES_V3_${workspaceSlug}_${projectId}_${moduleId}` : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await fetchFilters(workspaceSlug, projectId, moduleId);
        await fetchIssues(workspaceSlug, projectId, groupedIssueIds ? "mutation" : "init-loader", moduleId);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

      {loader === "init-loader" || !groupedIssueIds ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {Object.keys(groupedIssueIds ?? {}).length == 0 ? (
            <ModuleEmptyState workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} />
          ) : (
            <div className="h-full w-full overflow-auto">
              {activeLayout === "list" ? (
                <ModuleListLayout />
              ) : activeLayout === "kanban" ? (
                <ModuleKanBanLayout />
              ) : activeLayout === "calendar" ? (
                <ModuleCalendarLayout />
              ) : activeLayout === "gantt_chart" ? (
                <ModuleGanttLayout />
              ) : activeLayout === "spreadsheet" ? (
                <ModuleSpreadsheetLayout />
              ) : null}
            </div>
          )}
          {/* <ModuleEmptyState workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} /> */}
        </>
      )}
    </div>
  );
});
