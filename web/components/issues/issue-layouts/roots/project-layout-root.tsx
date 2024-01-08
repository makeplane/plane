import { FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// components
import {
  ListLayout,
  CalendarLayout,
  GanttLayout,
  KanBanLayout,
  ProjectAppliedFiltersRoot,
  ProjectSpreadsheetLayout,
  ProjectEmptyState,
  IssuePeekOverview,
} from "components/issues";
// ui
import { Spinner } from "@plane/ui";
// hooks
import { useApplication, useIssues } from "hooks/store";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ProjectLayoutRoot: FC = observer(() => {
  // hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId);
        await issues?.fetchIssues(workspaceSlug, projectId, issues?.groupedIssueIds ? "mutation" : "init-loader");
      }
    },
    { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />

      {issues?.loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {!issues?.groupedIssueIds ? (
            <div className="relative h-full w-full overflow-y-auto">
              <ProjectEmptyState />
            </div>
          ) : (
            <>
              <div className="relative h-full w-full overflow-auto bg-custom-background-90">
                {activeLayout === "list" ? (
                  <ListLayout />
                ) : activeLayout === "kanban" ? (
                  <KanBanLayout />
                ) : activeLayout === "calendar" ? (
                  <CalendarLayout />
                ) : activeLayout === "gantt_chart" ? (
                  <GanttLayout />
                ) : activeLayout === "spreadsheet" ? (
                  <ProjectSpreadsheetLayout />
                ) : null}
              </div>

              {/* peek overview */}
              <IssuePeekOverview />
            </>
          )}
        </>
      )}
    </div>
  );
});
