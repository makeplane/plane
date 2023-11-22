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

  // const {
  //   issueFilter: issueFilterStore,
  //   projectIssuesFilter: projectIssueFiltersStore,
  //   moduleIssue: moduleIssueStore,
  //   moduleIssueFilters: moduleIssueFiltersStore,
  // } = useMobxStore();

  // useSWR(
  //   workspaceSlug && projectId && moduleId ? `MODULE_FILTERS_AND_ISSUES_${moduleId.toString()}` : null,
  //   async () => {
  //     if (workspaceSlug && projectId && moduleId) {
  //       // fetching the project display filters and display properties
  //       await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
  //       await projectIssueFiltersStore.fetchUserProjectFilters(workspaceSlug, projectId);
  //       // fetching the module filters
  //       await moduleIssueFiltersStore.fetchModuleFilters(workspaceSlug, projectId, moduleId);
  //       // fetching the module issues
  //       await moduleIssueStore.fetchIssues(workspaceSlug, projectId, moduleId);
  //     }
  //   }
  // );

  const {
    moduleIssues: { loader, getIssues, fetchIssues },
    moduleIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && moduleId ? `MODULE_ISSUES_V3_${workspaceSlug}_${projectId}_${moduleId}` : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await fetchFilters(workspaceSlug, projectId, moduleId);
        await fetchIssues(workspaceSlug, projectId, moduleId, getIssues ? "mutation" : "init-loader");
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  activeLayout &&
    console.log(
      "--- Module issues ---",
      `workspaceSlug: ${workspaceSlug}, projectId: ${projectId}, moduleId: ${moduleId}`
    );
  activeLayout && console.log("activeLayout", activeLayout);
  activeLayout && console.log("issueFilters", issueFilters);
  activeLayout && console.log("getIssues", getIssues);
  activeLayout && console.log("---------------------------------");

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

      {loader === "init-loader" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          {/* <ModuleEmptyState workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} /> */}
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
        </>
      )}
    </div>
  );
});
