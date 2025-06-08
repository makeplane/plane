"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Rss, FileText, Layers, Loader as Spinner } from "lucide-react";
// plane imports
import { ETeamspaceNavigationItem, EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
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
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
// local components
import { TeamspaceWorkItemListHeaderActions } from "./issues";
import { TeamOverviewHeaderActions } from "./overview";
import { TeamspacePagesListHeaderActions } from "./pages-list";
import { TeamspaceViewsListHeaderActions } from "./views-list";

type TTeamspaceDetailHeaderProps = {
  selectedNavigationKey: ETeamspaceNavigationItem;
};

export const TeamspaceDetailHeader = observer((props: TTeamspaceDetailHeaderProps) => {
  const { selectedNavigationKey } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, teamspaceId } = useParams();
  // hooks
  const { loader, isCurrentUserMemberOfTeamspace, getTeamspaceById } = useTeamspaces();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId?.toString());
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

  const TEAM_NAVIGATION_ITEMS: TContextMenuItem[] = useMemo(
    () => [
      {
        key: ETeamspaceNavigationItem.OVERVIEW,
        title: "Overview",
        icon: Rss,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}`),
      },
      {
        key: ETeamspaceNavigationItem.ISSUES,
        title: "Work items",
        icon: LayersIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/issues`),
      },
      {
        key: ETeamspaceNavigationItem.CYCLES,
        title: "Cycles",
        icon: ContrastIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`),
      },
      {
        key: ETeamspaceNavigationItem.VIEWS,
        title: "Views",
        icon: Layers,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/views`),
      },
      {
        key: ETeamspaceNavigationItem.PAGES,
        title: "Pages",
        icon: FileText,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`),
      },
    ],
    [workspaceSlug, teamspaceId, router]
  );

  const TEAMS_HEADER_ACTIONS_MAP = useMemo(
    () =>
      new Map<ETeamspaceNavigationItem, React.ReactNode>([
        [
          ETeamspaceNavigationItem.OVERVIEW,
          <TeamOverviewHeaderActions
            key={ETeamspaceNavigationItem.OVERVIEW}
            teamspaceId={teamspaceId?.toString()}
            isEditingAllowed={hasAdminLevelPermissions}
          />,
        ],
        [
          ETeamspaceNavigationItem.ISSUES,
          <TeamspaceWorkItemListHeaderActions
            key={ETeamspaceNavigationItem.ISSUES}
            teamspaceId={teamspaceId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
        [ETeamspaceNavigationItem.CYCLES, undefined],
        [
          ETeamspaceNavigationItem.VIEWS,
          <TeamspaceViewsListHeaderActions
            key={ETeamspaceNavigationItem.VIEWS}
            teamspaceId={teamspaceId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
        [
          ETeamspaceNavigationItem.PAGES,
          <TeamspacePagesListHeaderActions
            key={ETeamspaceNavigationItem.PAGES}
            teamspaceId={teamspaceId?.toString()}
            isEditingAllowed={hasMemberLevelPermissions}
          />,
        ],
      ]),
    [hasAdminLevelPermissions, hasMemberLevelPermissions, teamspaceId]
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
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
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
                  ) : teamspace ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
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
                  navigationDisabled={
                    teamspace ? !isTeamspaceMember || !teamspace.id || !teamspace.project_ids?.length : false
                  }
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
