import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  KanBanLayout,
  ModuleAppliedFiltersRoot,
  ModuleCalendarLayout,
  ModuleGanttLayout,
  ModuleSpreadsheetLayout,
} from "components/issues";

export const ModuleAllLayouts: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { module: moduleStore, project: projectStore, issueFilter: issueFilterStore } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `MODULE_ISSUES` : null, async () => {
    if (workspaceSlug && projectId && moduleId) {
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());

      await projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString());
      await projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString());
      await projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString());

      await moduleStore.fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
      await moduleStore.fetchModuleIssues(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto">
      <ModuleAppliedFiltersRoot />
      <div className="h-full w-full">
        {activeLayout === "kanban" ? (
          <KanBanLayout />
        ) : activeLayout === "calendar" ? (
          <ModuleCalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <ModuleGanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <ModuleSpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
