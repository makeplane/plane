import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
// components
import {
  IssuePeekOverview,
  ModuleAppliedFiltersRoot,
  ModuleCalendarLayout,
  ModuleGanttLayout,
  ModuleKanBanLayout,
  ModuleListLayout,
  ModuleSpreadsheetLayout,
} from "components/issues";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
// types

const ModuleIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ModuleListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <ModuleKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <ModuleCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <ModuleGanttLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ModuleSpreadsheetLayout />;
    default:
      return null;
  }
};

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
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !moduleId) return <></>;

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout || undefined;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ModuleAppliedFiltersRoot />
      <div className="h-full w-full overflow-auto">
        <ModuleIssueLayout activeLayout={activeLayout} />
      </div>
      {/* peek overview */}
      <IssuePeekOverview />
    </div>
  );
});
