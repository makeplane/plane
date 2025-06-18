"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Activity, UsersRound } from "lucide-react";
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { CommentFillIcon, InfoFillIcon, Tabs } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";
// local components
import { TeamsOverviewSidebarActivity } from "./activity";
import { TeamsOverviewSidebarComments } from "./comments";
import { TeamsOverviewSidebarMembers } from "./members";
import { TeamsOverviewSidebarProperties } from "./properties/root";

type TTeamsOverviewSidebarProps = {
  teamspaceId: string;
};

export const TeamsOverviewSidebar: FC<TTeamsOverviewSidebarProps> = observer((props) => {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { isTeamSidebarCollapsed, getTeamspaceById, fetchTeamspaceEntities } = useTeamspaces();
  const { fetchTeamActivities, fetchTeamspaceComments } = useTeamspaceUpdates();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const hasAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );
  const hasMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );
  // fetch teamspace entities
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceEntities", workspaceSlug, teamspaceId] : null,
    () => fetchTeamspaceEntities(workspaceSlug!.toString(), teamspaceId),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  // fetching teamspace activity
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceActivity", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId ? () => fetchTeamActivities(workspaceSlug!.toString(), teamspaceId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // fetching teamspace comments
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceComments", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId ? () => fetchTeamspaceComments(workspaceSlug!.toString(), teamspaceId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // if teamspace is not found, return null
  if (!teamspaceId || !teamspace) return null;

  const TEAM_OVERVIEW_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: <TeamsOverviewSidebarProperties teamspaceId={teamspaceId} isEditingAllowed={hasAdminLevelPermissions} />,
    },
    {
      key: "members",
      icon: UsersRound,
      content: <TeamsOverviewSidebarMembers teamspaceId={teamspaceId} isEditingAllowed={hasAdminLevelPermissions} />,
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: <TeamsOverviewSidebarComments teamspaceId={teamspaceId} isEditingAllowed={hasMemberLevelPermissions} />,
    },
    {
      key: "activity",
      icon: Activity,
      content: <TeamsOverviewSidebarActivity teamspaceId={teamspaceId} />,
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
        storageKey={`teamspace-overview-sidebar-${teamspaceId}`}
        defaultTab="properties"
        containerClassName="gap-4"
        tabListContainerClassName="px-6"
        tabPanelClassName="overflow-hidden"
      />
    </div>
  );
});
