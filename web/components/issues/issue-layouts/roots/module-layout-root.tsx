import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
// components
import {
  IssuePeekOverview,
  ModuleAppliedFiltersRoot,
  ModuleCalendarLayout,
  ModuleEmptyState,
  ModuleGanttLayout,
  ModuleKanBanLayout,
  ModuleListLayout,
  ModuleSpreadsheetLayout,
} from "components/issues";
import { ActiveLoader } from "components/ui";
// ui
import { Spinner } from "@plane/ui";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ModuleLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  useSWR(
    workspaceSlug && projectId && moduleId
      ? `MODULE_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}_${moduleId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader",
          moduleId.toString()
        );
      }
    }
  );

  if (!workspaceSlug || !projectId || !moduleId) return <></>;

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout || undefined;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return (
      <>
        {activeLayout ? (
          <ActiveLoader layout={activeLayout} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </>
    );
  }

  if (issues?.groupedIssueIds?.length === 0) {
    return (
      <div className="relative h-full w-full overflow-y-auto">
        <ModuleEmptyState
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          moduleId={moduleId.toString()}
          activeLayout={activeLayout}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

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
      {/* peek overview */}
      <IssuePeekOverview />
    </div>
  );
});
