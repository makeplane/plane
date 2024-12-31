"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Activity, UsersRound } from "lucide-react";
import { CommentFillIcon, InfoFillIcon, Tabs } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
import { useTeamUpdates } from "@/plane-web/hooks/store/teams/use-team-updates";
// local components
import { TeamsOverviewSidebarActivity } from "./activity";
import { TeamsOverviewSidebarComments } from "./comments";
import { TeamsOverviewSidebarMembers } from "./members";
import { TeamsOverviewSidebarProperties } from "./properties/root";

type TTeamsOverviewSidebarProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewSidebar: FC<TTeamsOverviewSidebarProps> = observer((props) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { isTeamSidebarCollapsed, getTeamById, fetchTeamEntities } = useTeams();
  const { fetchTeamActivities, fetchTeamComments } = useTeamUpdates();
  // derived values
  const team = getTeamById(teamId);
  // fetch team entities
  useSWR(
    workspaceSlug && teamId ? ["teamEntities", workspaceSlug, teamId] : null,
    () => fetchTeamEntities(workspaceSlug!.toString(), teamId),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  // fetching team activity
  useSWR(
    workspaceSlug && teamId ? ["teamActivity", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamActivities(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // fetching team comments
  useSWR(
    workspaceSlug && teamId ? ["teamComments", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamComments(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // if team is not found, return null
  if (!teamId || !team) return null;

  const TEAM_OVERVIEW_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: <TeamsOverviewSidebarProperties teamId={teamId} isEditingAllowed={isEditingAllowed} />,
    },
    {
      key: "members",
      icon: UsersRound,
      content: <TeamsOverviewSidebarMembers teamId={teamId} isEditingAllowed={isEditingAllowed} />,
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: <TeamsOverviewSidebarComments teamId={teamId} isEditingAllowed={isEditingAllowed} />,
    },
    {
      key: "activity",
      icon: Activity,
      content: <TeamsOverviewSidebarActivity teamId={teamId} />,
    },
  ];

  return (
    <div
      className={cn(
        `absolute flex flex-col gap-4 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 sm:relative transition-[width] ease-linear`,
        {
          "w-0 hidden": isTeamSidebarCollapsed,
          "min-w-[300px] w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": !isTeamSidebarCollapsed,
        }
      )}
      style={isTeamSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      <Tabs
        tabs={TEAM_OVERVIEW_SIDEBAR_TABS}
        storageKey={`teams-overview-sidebar-${teamId}`}
        defaultTab="properties"
        containerClassName="gap-4"
        tabListContainerClassName="px-6"
        tabPanelClassName="overflow-hidden"
      />
    </div>
  );
});
