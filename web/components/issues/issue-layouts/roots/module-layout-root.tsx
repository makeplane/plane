import React, { Fragment } from "react";
import size from "lodash/size";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IIssueFilterOptions } from "@plane/types";
// mobx store
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
} from "@/components/issues";
import { ActiveLoader } from "@/components/ui";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// types

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
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const userFilters = issuesFilter?.issueFilters?.filters;

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      {
        ...newFilters,
      },
      moduleId.toString()
    );
  };

  if (!workspaceSlug || !projectId || !moduleId) return <></>;

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout || undefined;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <>{activeLayout && <ActiveLoader layout={activeLayout} />}</>;
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />

      {issues?.groupedIssueIds?.length === 0 ? (
        <div className="relative h-full w-full overflow-y-auto">
          <ModuleEmptyState
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            moduleId={moduleId.toString()}
            activeLayout={activeLayout}
            handleClearAllFilters={handleClearAllFilters}
            isEmptyFilters={issueFilterCount > 0}
          />
        </div>
      ) : (
        <Fragment>
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
        </Fragment>
      )}
    </div>
  );
});
