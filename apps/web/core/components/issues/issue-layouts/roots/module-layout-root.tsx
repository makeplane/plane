import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Row, ERowVariant } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// local imports
import { IssuePeekOverview } from "../../peek-overview";
import { ModuleCalendarLayout } from "../calendar/roots/module-root";
import { ModuleAppliedFiltersRoot } from "../filters";
import { BaseGanttRoot } from "../gantt";
import { ModuleKanBanLayout } from "../kanban/roots/module-root";
import { ModuleListLayout } from "../list/roots/module-root";
import { ModuleSpreadsheetLayout } from "../spreadsheet/roots/module-root";

const ModuleIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined; moduleId: string }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ModuleListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <ModuleKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <ModuleCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot viewId={props.moduleId} />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ModuleSpreadsheetLayout />;
    default:
      return null;
  }
};

export const ModuleLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, moduleId } = useParams();
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const { isLoading } = useSWR(
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

  const issueFilters = issuesFilter?.getIssueFilters(moduleId?.toString());

  if (!workspaceSlug || !projectId || !moduleId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.MODULE}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ModuleAppliedFiltersRoot />
        <Row variant={ERowVariant.HUGGING} className="h-full w-full overflow-auto">
          <ModuleIssueLayout activeLayout={activeLayout} moduleId={moduleId?.toString()} />
        </Row>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
