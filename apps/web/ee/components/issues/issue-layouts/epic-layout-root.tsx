"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssueLayoutTypes } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Spinner } from "@plane/ui";
// components
import { BaseGanttRoot, ProjectAppliedFiltersRoot } from "@/components/issues";
// constants
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
import { EpicPeekOverview } from "../../epics/peek-overview";
import { EpicCalendarLayout } from "./calendar-epic-root";
import { EpicKanBanLayout } from "./kanban-epic-root";
import { EpicListLayout } from "./list-epic-root";
import { EpicSpreadsheetLayout } from "./spreadsheet-epic-root";

const ProjectEpicsLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <EpicListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <EpicKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <EpicCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot isEpic />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <EpicSpreadsheetLayout />;
    default:
      return null;
  }
};

export const ProjectEpicsLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.EPIC);
  const { fetchEpicStats } = useEpicAnalytics();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_EPICS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_EPIC_STATS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchEpicStats(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId) return <></>;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.EPIC}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ProjectAppliedFiltersRoot storeType={EIssuesStoreType.EPIC} />
        <div className="relative h-full w-full overflow-auto bg-custom-background-90">
          {/* mutation loader */}
          {issues?.getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <ProjectEpicsLayout activeLayout={activeLayout} />
        </div>
        <EpicPeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
