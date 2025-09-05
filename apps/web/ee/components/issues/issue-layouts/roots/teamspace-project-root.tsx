import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// ui
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { CalendarLayout } from "@/components/issues/issue-layouts/calendar/roots/project-root";
import { KanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/project-root";
import { ListLayout } from "@/components/issues/issue-layouts/list/roots/project-root";
import { ProjectSpreadsheetLayout } from "@/components/issues/issue-layouts/spreadsheet/roots/project-root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// plane web components
import { TeamspaceProjectWorkItemAppliedFiltersRoot } from "@/plane-web/components/issues/filters/applied-filters/roots/teamspace-project";

const TeamspaceProjectWorkItemLayout: FC<{ activeLayout: EIssueLayoutTypes | undefined }> = ({ activeLayout }) => {
  switch (activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <KanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectSpreadsheetLayout />;
    default:
      return null;
  }
};

export const TeamspaceProjectWorkLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);
  // swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug?.toString());
  // fetch teamspace view issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamspaceId && projectId
      ? `TEAMSPACE_PROJECT_WORK_ITEMS_ISSUE_FILTERS_${workspaceSlug}_${teamspaceId}_${projectId}`
      : null,
    async () => {
      if (workspaceSlug && teamspaceId && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), teamspaceId.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // get teamspace view issue filters
  const issueFilters = issuesFilter?.getIssueFilters(projectId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !teamspaceId || !projectId) return <></>;

  if (isLoading && !issueFilters) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <TeamspaceProjectWorkItemAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto">
          {/* mutation loader */}
          {issues?.getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <TeamspaceProjectWorkItemLayout activeLayout={activeLayout} />
        </div>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
