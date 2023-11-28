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
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const {
    moduleIssues: { loader, getIssues, fetchIssues },
    moduleIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && moduleId ? `MODULE_ISSUES_V3_${workspaceSlug}_${projectId}_${moduleId}` : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await fetchFilters(workspaceSlug, projectId, moduleId);
        await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader", moduleId);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

      {loader === "init-loader" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          {Object.keys(getIssues ?? {}).length == 0 ? (
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
