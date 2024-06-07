import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { Spinner } from "@plane/ui";
import {
  ListLayout,
  CalendarLayout,
  GanttLayout,
  KanBanLayout,
  ProjectAppliedFiltersRoot,
  ProjectSpreadsheetLayout,
  ProjectEmptyState,
  IssuePeekOverview,
} from "@/components/issues";
import { ActiveLoader } from "@/components/ui";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useIssues } from "@/hooks/store";

export const ProjectLayoutRoot: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader"
        );
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId) return <></>;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <>{activeLayout && <ActiveLoader layout={activeLayout} />}</>;
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />

      {issues?.groupedIssueIds?.length === 0 ? (
        <ProjectEmptyState />
      ) : (
        <Fragment>
          <div className="relative h-full w-full overflow-auto bg-custom-background-90">
            {/* mutation loader */}
            {issues?.loader === "mutation" && (
              <div className="fixed w-[40px] h-[40px] z-50 right-[16px] top-[64px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
                <Spinner className="w-4 h-4" />
              </div>
            )}
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
        </Fragment>
      )}
    </div>
  );
});
