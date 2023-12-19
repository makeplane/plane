import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
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

  const {
    issues: { loader, getIssuesIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROJECT);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_V3_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchFilters(workspaceSlug, projectId);
        await fetchIssues(workspaceSlug, projectId, getIssuesIds ? "mutation" : "init-loader");
      }
    },
    { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  );

  // TODO: update this
  // const {
  //   issues: {
  //     loader: issueLoader,
  //     getIssues: issueGetIssues,
  //     getIssuesIds: issueGetIssuesIds,
  //     fetchIssues: issueFetchIssues,
  //   },
  //   issuesFilter: { issueFilters: issueIssueFilters, fetchFilters: issueFetchFilters },
  // } = useStoreIssues("project");

  // useSWR(workspaceSlug && projectId ? `PROJECT_ISSUES_V3_UPGRADED_${workspaceSlug}_${projectId}` : null, async () => {
  //   if (workspaceSlug && projectId) {
  //     await issueFetchFilters(workspaceSlug, projectId);
  //     await issueFetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader");
  //   }
  // });

  // console.log("---");
  // console.log("issueGetIssuesIds", issueGetIssuesIds);
  // console.log("issueGetIssues", issueGetIssues);
  // console.log("---");

  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />

      {loader === "init-loader" || !getIssuesIds ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {(getIssuesIds ?? {}).length == 0 ? (
            <ProjectEmptyState />
          ) : (
            <div className="relative h-full w-full overflow-auto">
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
