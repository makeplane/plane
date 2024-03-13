import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
// ui
import { Spinner } from "@plane/ui";
import {
  ListLayout,
  CalendarLayout,
  GanttLayout,
  KanBanLayout,
  ProjectAppliedFiltersRoot,
  ProjectSpreadsheetLayout,
  IssuePeekOverview,
} from "components/issues";
// hooks
// helpers
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";

const ProjectIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <KanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <GanttLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectSpreadsheetLayout />;
    default:
      return null;
  }
};

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
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId) return <></>;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />
      <div className="relative h-full w-full overflow-auto bg-custom-background-90">
        {/* mutation loader */}
        {issues?.loader === "mutation" && (
          <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
            <Spinner className="w-4 h-4" />
          </div>
        )}
        <ProjectIssueLayout activeLayout={activeLayout} />
      </div>

      {/* peek overview */}
      <IssuePeekOverview />
    </div>
  );
});
