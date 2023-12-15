import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
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

export const ModuleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const {
    moduleIssues: { loader, getIssues, fetchIssues },
    moduleIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && moduleId ? `MODULE_ISSUES_V3_${workspaceSlug}_${projectId}_${moduleId}` : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await fetchFilters(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
        await fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          getIssues ? "mutation" : "init-loader",
          moduleId.toString()
        );
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

      {loader === "init-loader" || !getIssues ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {Object.keys(getIssues ?? {}).length == 0 ? (
            <ModuleEmptyState
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
              moduleId={moduleId?.toString()}
            />
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
