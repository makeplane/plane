import { useRouter } from "next/router";
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
} from "components/issues";
import { Spinner } from "@plane/ui";
import { useIssues } from "hooks/store/use-issues";
import { EIssuesStoreType } from "constants/issue";
// hooks

export const ProjectLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_V3_${workspaceSlug}_${projectId}` : null,
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

      {issues?.loader === "init-loader" || !issues?.groupedIssueIds ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {(issues?.groupedIssueIds ?? {}).length == 0 ? (
            <ProjectEmptyState />
          ) : (
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
          )}
        </>
      )}
    </div>
  );
});
