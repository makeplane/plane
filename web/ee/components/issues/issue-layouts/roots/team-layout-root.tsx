"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EIssueLayoutTypes, EIssuesStoreType, ETeamEntityScope } from "@plane/constants";
import { Spinner, Tabs } from "@plane/ui";
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
// plane web imports
import { TeamAppliedFiltersRoot } from "@/plane-web/components/issues/filters/applied-filters/roots";
import { getTeamEntityScopeLabel } from "@/plane-web/helpers/team-helper";

const TeamIssueLayout: FC<{ activeLayout: EIssueLayoutTypes | undefined }> = ({ activeLayout }) => {
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

const TeamIssueLayoutContent: FC<{ issueLoader: string }> = observer(({ issueLoader }) => {
  // store hooks
  const { teamId } = useParams();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // derived values
  const issueFilters = issuesFilter?.getIssueFilters(teamId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative h-full w-full overflow-auto bg-custom-background-90">
      {issueLoader === "mutation" && (
        <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
          <Spinner className="w-4 h-4" />
        </div>
      )}
      <TeamIssueLayout activeLayout={activeLayout} />
    </div>
  );
});

export const TeamLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug, teamId } = useParams();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // fetch all issue properties
  useWorkspaceIssueProperties(workspaceSlug?.toString());
  // fetch team issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamId ? `TEAM_ISSUE_FILTERS_${workspaceSlug}_${teamId}` : null,
    async () => {
      if (workspaceSlug && teamId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), teamId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // derived values
  const issueLoader = issues?.getIssueLoader();

  const TEAM_ISSUES_TABS = useMemo(
    () => [
      {
        key: ETeamEntityScope.TEAM,
        label: getTeamEntityScopeLabel(ETeamEntityScope.TEAM),
        content: <TeamIssueLayoutContent issueLoader={issueLoader || ""} />,
        onClick: () => issuesFilter?.updateTeamScope(teamId!.toString(), ETeamEntityScope.TEAM),
        disabled: issueLoader === "init-loader",
      },
      {
        key: ETeamEntityScope.PROJECT,
        label: getTeamEntityScopeLabel(ETeamEntityScope.PROJECT),
        content: <TeamIssueLayoutContent issueLoader={issueLoader || ""} />,
        onClick: () => issuesFilter?.updateTeamScope(teamId!.toString(), ETeamEntityScope.PROJECT),
        disabled: issueLoader === "init-loader",
      },
    ],
    [teamId, issueLoader, issuesFilter]
  );

  if (!workspaceSlug || !teamId) return <></>;

  if (isLoading && !issuesFilter?.getIssueFilters(teamId?.toString()))
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <Tabs
          tabs={TEAM_ISSUES_TABS}
          defaultTab={issuesFilter.getTeamScope(teamId?.toString())}
          size="sm"
          containerClassName="gap-0"
          tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
          tabListClassName="my-2 max-w-36"
          tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
          storeInLocalStorage={false}
          actions={<TeamAppliedFiltersRoot />}
        />
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
