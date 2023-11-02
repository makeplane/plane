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

type Props = {
  openIssuesListModal: () => void;
};

export const ModuleLayoutRoot: React.FC<Props> = observer(({ openIssuesListModal }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const {
    issueFilter: issueFilterStore,
    moduleIssue: moduleIssueStore,
    moduleFilter: moduleIssueFilterStore,
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && moduleId ? `MODULE_FILTERS_AND_ISSUES_${moduleId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        // fetching the project display filters and display properties
        await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
        // fetching the module filters
        await moduleIssueFilterStore.fetchModuleFilters(workspaceSlug, projectId, moduleId);

        // fetching the module issues
        await moduleIssueStore.fetchIssues(workspaceSlug, projectId, moduleId);
      }
    }
  );

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const issueCount = moduleIssueStore.getIssuesCount;

  if (!moduleIssueStore.getIssues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />
      {(activeLayout === "list" || activeLayout === "spreadsheet") && issueCount === 0 ? (
        <ModuleEmptyState openIssuesListModal={openIssuesListModal} />
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
    </div>
  );
});
