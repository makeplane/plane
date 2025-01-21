"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Rss, BriefcaseIcon, FileText, Layers, Loader as Spinner } from "lucide-react";
// constants
import { ETeamNavigationItem } from "@plane/constants";
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
  Loader,
} from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
// local components
import { TeamIssueListHeaderActions } from "./issues";
import { TeamOverviewHeaderActions } from "./overview";
import { TeamPagesListHeaderActions } from "./pages-list";
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
  const { loader, isUserMemberOfTeam, getTeamById } = useTeams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const team = getTeamById(teamId?.toString());
  const isTeamMember = isUserMemberOfTeam(teamId?.toString());
  const hasAdminLevelPermissions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );
  const hasMemberLevelPermissions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  const TEAM_NAVIGATION_ITEMS: TContextMenuItem[] = useMemo(
    () => [
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
    ],
    [workspaceSlug, teamId, router]
  );

  const TEAMS_HEADER_ACTIONS_MAP = useMemo(
    () =>
      new Map<ETeamNavigationItem, React.ReactNode>([
        [
          ETeamNavigationItem.OVERVIEW,
          <TeamOverviewHeaderActions
            key={ETeamNavigationItem.OVERVIEW}
            teamId={teamId?.toString()}
            isEditingAllowed={hasAdminLevelPermissions}
          />,
        ],
        [
          ETeamNavigationItem.PROJECTS,
          <TeamProjectListHeaderActions
            key={ETeamNavigationItem.PROJECTS}
            teamId={teamId?.toString()}
            isEditingAllowed={hasAdminLevelPermissions}
          />,
        ],
        [
          ETeamNavigationItem.ISSUES,
          <TeamIssueListHeaderActions
            key={ETeamNavigationItem.ISSUES}
            teamId={teamId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
        [ETeamNavigationItem.CYCLES, undefined],
        [
          ETeamNavigationItem.VIEWS,
          <TeamViewsListHeaderActions
            key={ETeamNavigationItem.VIEWS}
            teamId={teamId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
        [
          ETeamNavigationItem.PAGES,
          <TeamPagesListHeaderActions
            key={ETeamNavigationItem.PAGES}
            teamId={teamId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
      ]),
    [hasAdminLevelPermissions, hasMemberLevelPermissions, teamId]
  );

  const currentHeaderAction = useMemo(
    () => TEAMS_HEADER_ACTIONS_MAP.get(selectedNavigationKey),
    [TEAMS_HEADER_ACTIONS_MAP, selectedNavigationKey]
  );

  if (!workspaceSlug) return <></>;
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
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : team ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teams/${teamId}`}
                      label={team.name}
                      icon={team.logo_props && <Logo logo={team.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <BreadcrumbNavigationDropdown
                  selectedItemKey={selectedNavigationKey}
                  navigationItems={TEAM_NAVIGATION_ITEMS}
                  navigationDisabled={team ? !isTeamMember || !team.id || !team.project_ids?.length : false}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem className="flex items-center">
        {loader === "mutation" && <Spinner size={14} className="flex-shrink-0 animate-spin" />}
        {currentHeaderAction}
      </Header.RightItem>
    </Header>
  );
});
