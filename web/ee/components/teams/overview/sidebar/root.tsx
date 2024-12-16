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

  // if team is not found, return null
  if (!teamId || !team) return null;

  const TEAM_OVERVIEW_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: <TeamsOverviewSidebarProperties team={team} isEditingAllowed={isEditingAllowed} />,
    },
    {
      key: "members",
      icon: UsersRound,
      content: <TeamsOverviewSidebarMembers team={team} isEditingAllowed={isEditingAllowed} />,
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: <TeamsOverviewSidebarComments />,
      disabled: true,
    },
    {
      key: "activity",
      icon: Activity,
      content: <TeamsOverviewSidebarActivity />,
      disabled: true,
    },
  ];

  return (
    <div
      className={cn(
        `absolute right-0 z-[5] flex flex-col gap-4 p-6 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 sm:relative transition-[width] ease-linear overflow-hidden overflow-y-auto`,
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
      />
    </div>
  );
});
