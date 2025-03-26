"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EIssueLayoutTypes, EIssuesStoreType, ETeamspaceEntityScope } from "@plane/constants";
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
import { TeamspaceAppliedFiltersRoot } from "@/plane-web/components/issues/filters/applied-filters/roots";
import { getTeamspaceEntityScopeLabel } from "@/plane-web/helpers/teamspace-helper";

const TeamspaceWorkItemLayout: FC<{ activeLayout: EIssueLayoutTypes | undefined }> = ({ activeLayout }) => {
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

const TeamspaceWorkItemLayoutContent: FC<{ issueLoader: string }> = observer(({ issueLoader }) => {
  // store hooks
  const { teamspaceId } = useParams();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // derived values
  const issueFilters = issuesFilter?.getIssueFilters(teamspaceId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative h-full w-full overflow-auto bg-custom-background-90">
      {issueLoader === "mutation" && (
        <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
          <Spinner className="w-4 h-4" />
        </div>
      )}
      <TeamspaceWorkItemLayout activeLayout={activeLayout} />
    </div>
  );
});

export const TeamspaceLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId } = useParams();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // fetch all issue properties
  useWorkspaceIssueProperties(workspaceSlug?.toString());
  // fetch teamspace issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamspaceId ? `TEAMSPACE_ISSUE_FILTERS_${workspaceSlug}_${teamspaceId}` : null,
    async () => {
      if (workspaceSlug && teamspaceId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), teamspaceId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // derived values
  const issueLoader = issues?.getIssueLoader();

  const TEAM_ISSUES_TABS = useMemo(
    () => [
      {
        key: ETeamspaceEntityScope.TEAM,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.TEAM),
        content: <TeamspaceWorkItemLayoutContent issueLoader={issueLoader || ""} />,
        onClick: () => issuesFilter?.updateTeamScope(teamspaceId!.toString(), ETeamspaceEntityScope.TEAM),
        disabled: issueLoader === "init-loader",
      },
      {
        key: ETeamspaceEntityScope.PROJECT,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.PROJECT),
        content: <TeamspaceWorkItemLayoutContent issueLoader={issueLoader || ""} />,
        onClick: () => issuesFilter?.updateTeamScope(teamspaceId!.toString(), ETeamspaceEntityScope.PROJECT),
        disabled: issueLoader === "init-loader",
      },
    ],
    [teamspaceId, issueLoader, issuesFilter]
  );

  if (!workspaceSlug || !teamspaceId) return <></>;

  if (isLoading && !issuesFilter?.getIssueFilters(teamspaceId?.toString()))
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
          defaultTab={issuesFilter.getTeamspaceScope(teamspaceId?.toString())}
          size="sm"
          containerClassName="gap-0"
          tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
          tabListClassName="my-2 max-w-36"
          tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
          storeInLocalStorage={false}
          actions={<TeamspaceAppliedFiltersRoot />}
        />
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
