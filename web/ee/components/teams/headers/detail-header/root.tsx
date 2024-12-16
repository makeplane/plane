"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Rss, BriefcaseIcon, FileText, Layers } from "lucide-react";
// ui
import {
  Breadcrumbs,
  BreadcrumbNavigationDropdown,
  Logo,
  TeamsIcon,
  LayersIcon,
  ContrastIcon,
  TContextMenuItem,
  Header,
} from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
// plane web types
import { ETeamNavigationItem } from "@/plane-web/types";
// local components
import { TeamIssueListHeaderActions } from "./issues";
import { TeamOverviewHeaderActions } from "./overview";
import { TeamProjectListHeaderActions } from "./projects";
import { TeamViewsListHeaderActions } from "./views-list";

type TTeamDetailHeaderProps = {
  selectedNavigationKey: ETeamNavigationItem;
};

export const TeamDetailHeader = observer((props: TTeamDetailHeaderProps) => {
  const { selectedNavigationKey } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, teamId } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { getTeamById } = useTeams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const team = getTeamById(teamId?.toString());
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  const TEAM_NAVIGATION_ITEMS: TContextMenuItem[] = [
    {
      key: ETeamNavigationItem.OVERVIEW,
      title: "Overview",
      icon: Rss,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}`),
    },
    {
      key: ETeamNavigationItem.PROJECTS,
      title: "Projects",
      icon: BriefcaseIcon,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}/projects`),
    },
    {
      key: ETeamNavigationItem.ISSUES,
      title: "Issues",
      icon: LayersIcon,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}/issues`),
    },
    {
      key: ETeamNavigationItem.CYCLES,
      title: "Cycles",
      icon: ContrastIcon,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}/cycles`),
    },
    {
      key: ETeamNavigationItem.VIEWS,
      title: "Views",
      icon: Layers,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}/views`),
    },
    {
      key: ETeamNavigationItem.PAGES,
      title: "Pages",
      icon: FileText,
      action: () => router.push(`/${workspaceSlug}/teams/${teamId}/pages`),
    },
  ];

  const TEAMS_HEADER_ACTIONS_MAP = new Map<ETeamNavigationItem, React.ReactNode>([
    [
      ETeamNavigationItem.OVERVIEW,
      <TeamOverviewHeaderActions
        key={ETeamNavigationItem.OVERVIEW}
        teamId={teamId?.toString()}
        isEditingAllowed={isEditingAllowed}
      />,
    ],
    [
      ETeamNavigationItem.PROJECTS,
      <TeamProjectListHeaderActions
        key={ETeamNavigationItem.PROJECTS}
        teamId={teamId?.toString()}
        isEditingAllowed={isEditingAllowed}
      />,
    ],
    [
      ETeamNavigationItem.ISSUES,
      <TeamIssueListHeaderActions key={ETeamNavigationItem.ISSUES} teamId={teamId?.toString()} />,
    ],
    [ETeamNavigationItem.CYCLES, undefined],
    [
      ETeamNavigationItem.VIEWS,
      <TeamViewsListHeaderActions
        key={ETeamNavigationItem.VIEWS}
        teamId={teamId?.toString()}
        isEditingAllowed={isEditingAllowed}
      />,
    ],
    [ETeamNavigationItem.PAGES, undefined],
  ]);

  const currentHeaderAction = TEAMS_HEADER_ACTIONS_MAP.get(selectedNavigationKey);

  if (!workspaceSlug || !workspaceId || !team) return <></>;
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teams`}
                  label="Teams"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teams/${teamId}`}
                  label={team.name}
                  icon={team.logo_props && <Logo logo={team.logo_props} />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <BreadcrumbNavigationDropdown
                  selectedItemKey={selectedNavigationKey}
                  navigationItems={TEAM_NAVIGATION_ITEMS}
                  navigationDisabled={!team.id || !team.project_ids?.length}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>{currentHeaderAction}</Header.RightItem>
    </Header>
  );
});
