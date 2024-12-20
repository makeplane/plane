"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/constants";
// ui
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import {
  ListLayout,
  CalendarLayout,
  KanBanLayout,
  ProjectSpreadsheetLayout,
  IssuePeekOverview,
} from "@/components/issues";
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// plane web components
import { TeamAppliedFiltersRoot } from "@/plane-web/components/issues/filters/applied-filters/roots";

const TeamIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
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

export const TeamLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug, teamId } = useParams();
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug?.toString());
  // fetch issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamId ? `TEAM_ISSUE_FILTERS_${workspaceSlug}_${teamId}` : null,
    async () => {
      if (workspaceSlug && teamId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), teamId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // get issue filters
  const issueFilters = issuesFilter?.getIssueFilters(teamId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !teamId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <TeamAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto bg-custom-background-90">
          {/* mutation loader */}
          {issues?.getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <TeamIssueLayout activeLayout={activeLayout} />
        </div>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
