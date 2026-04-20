/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { Activity, UsersRound } from "lucide-react";
import { CommentFillIcon, InfoFillIcon } from "@plane/propel/icons";
import { Tabs } from "@plane/propel/tabs";

// helpers
import { cn } from "@plane/utils";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";
// types
import type { TTeamspaceDetailPermissions } from "@/store/teamspace/permissions/root";
// local components
import { TeamsOverviewSidebarActivity } from "./activity";
import { TeamsOverviewSidebarComments } from "./comments";
import { TeamsOverviewSidebarMembers } from "./members";
import { TeamsOverviewSidebarProperties } from "./properties/root";

type TTeamsOverviewSidebarProps = {
  permissions: TTeamspaceDetailPermissions;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamsOverviewSidebar = observer(function TeamsOverviewSidebar(props: TTeamsOverviewSidebarProps) {
  const { teamspaceId, workspaceSlug, permissions } = props;
  // hooks
  const { isTeamSidebarCollapsed, getTeamspaceById, fetchTeamspaceEntities } = useTeamspaces();
  const { fetchTeamActivities, fetchTeamspaceComments } = useTeamspaceUpdates();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  // fetch teamspace entities
  useSWR(["teamspaceEntities", workspaceSlug, teamspaceId], () => fetchTeamspaceEntities(workspaceSlug, teamspaceId), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  // fetching teamspace activity
  useSWR(["teamspaceActivity", workspaceSlug, teamspaceId], () => fetchTeamActivities(workspaceSlug, teamspaceId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching teamspace comments
  useSWR(["teamspaceComments", workspaceSlug, teamspaceId], () => fetchTeamspaceComments(workspaceSlug, teamspaceId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  // if teamspace is not found, return null
  if (!teamspace) return null;

  const TEAM_OVERVIEW_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: <TeamsOverviewSidebarProperties teamspaceId={teamspaceId} canManage={permissions.canManage} />,
    },
    {
      key: "members",
      icon: UsersRound,
      content: <TeamsOverviewSidebarMembers teamspaceId={teamspaceId} canManage={permissions.canManage} />,
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: <TeamsOverviewSidebarComments teamspaceId={teamspaceId} comments={permissions.comments} />,
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
        `absolute flex flex-col gap-4 h-full border-l border-subtle-1 bg-surface-1 py-5 sm:relative transition-[width] ease-linear`,
        {
          "w-0 hidden": isTeamSidebarCollapsed,
          "min-w-[300px] w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": !isTeamSidebarCollapsed,
        }
      )}
      style={isTeamSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      <div className="px-4 flex-1 overflow-hidden">
        <Tabs defaultValue={TEAM_OVERVIEW_SIDEBAR_TABS[0].key}>
          <Tabs.List className="shrink-0">
            {TEAM_OVERVIEW_SIDEBAR_TABS.map((tab) => (
              <Tabs.Trigger key={tab.key} value={tab.key}>
                {tab.icon && <tab.icon className="size-4" />}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="mt-4 flex-1 overflow-auto">
            {TEAM_OVERVIEW_SIDEBAR_TABS.map((tab) => (
              <Tabs.Content key={tab.key} value={tab.key}>
                {tab.content}
              </Tabs.Content>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
});
