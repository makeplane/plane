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

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { ETeamspaceNavigationItem } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import {
  CycleIcon,
  WorkItemsIcon,
  PageIcon,
  ProjectIcon,
  TeamsIcon,
  ViewsIcon,
  OverviewIcon,
} from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import {
  Breadcrumbs,
  BreadcrumbNavigationDropdown,
  BreadcrumbNavigationSearchDropdown,
  Header,
  Loader,
} from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
// local components
import { TeamspaceWorkItemListHeaderActions } from "./issues";
import { TeamOverviewHeaderActions } from "./overview";
import { TeamspacePagesListHeaderActions } from "./pages-list";
import { TeamspaceProjectListHeaderActions } from "./projects-list";
import { TeamspaceViewsListHeaderActions } from "./views-list";

type TTeamspaceDetailHeaderProps = {
  selectedNavigationKey: ETeamspaceNavigationItem;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamspaceDetailHeader = observer(function TeamspaceDetailHeader(props: TTeamspaceDetailHeaderProps) {
  const { selectedNavigationKey, teamspaceId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // hooks
  const { loader, isCurrentUserMemberOfTeamspace, getTeamspaceById, allTeamSpaceIds, permissions } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);

  const TEAMSPACE_SEARCH_OPTIONS: ICustomSearchSelectOption[] = useMemo(
    () =>
      allTeamSpaceIds
        .map((id) => getTeamspaceById(id))
        .filter((teamspace): teamspace is NonNullable<typeof teamspace> => Boolean(teamspace))
        .map((teamspaceItem) => ({
          value: teamspaceItem.id,
          query: teamspaceItem.name,
          content: (
            <div className="flex items-center gap-2">
              {teamspaceItem.logo_props ? (
                <Logo logo={teamspaceItem.logo_props} />
              ) : (
                <TeamsIcon className="h-4 w-4 text-tertiary" />
              )}
              <span>{teamspaceItem.name}</span>
            </div>
          ),
        })),
    [allTeamSpaceIds, getTeamspaceById]
  );

  const TEAM_NAVIGATION_ITEMS: TContextMenuItem[] = useMemo(
    () => [
      {
        key: ETeamspaceNavigationItem.OVERVIEW,
        title: "Overview",
        icon: OverviewIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}`),
      },
      {
        key: ETeamspaceNavigationItem.PROJECTS,
        title: "Projects",
        icon: ProjectIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/projects`),
      },
      {
        key: ETeamspaceNavigationItem.ISSUES,
        title: "Work items",
        icon: WorkItemsIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/issues`),
      },
      {
        key: ETeamspaceNavigationItem.CYCLES,
        title: "Cycles",
        icon: CycleIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`),
      },
      {
        key: ETeamspaceNavigationItem.VIEWS,
        title: "Views",
        icon: ViewsIcon,
        action: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/views`),
      },
      {
        key: ETeamspaceNavigationItem.PAGES,
        title: "Pages",
        icon: PageIcon,
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
            teamspaceId={teamspaceId}
            permissions={{
              canEdit: permissions.getCanEdit(workspaceSlug, teamspaceId),
              canDelete: permissions.getCanDelete(workspaceSlug, teamspaceId),
            }}
          />,
        ],
        [
          ETeamspaceNavigationItem.ISSUES,
          <TeamspaceWorkItemListHeaderActions
            key={ETeamspaceNavigationItem.ISSUES}
            teamspaceId={teamspaceId}
            permissions={{ canCreateWorkItem: permissions.getCanCreateWorkItem(workspaceSlug, teamspaceId) }}
          />,
        ],
        [ETeamspaceNavigationItem.CYCLES, undefined],
        [
          ETeamspaceNavigationItem.VIEWS,
          <TeamspaceViewsListHeaderActions
            key={ETeamspaceNavigationItem.VIEWS}
            teamspaceId={teamspaceId}
            permissions={{ canCreateView: permissions.getViewPermissions(workspaceSlug, teamspaceId).canCreate }}
          />,
        ],
        [
          ETeamspaceNavigationItem.PAGES,
          <TeamspacePagesListHeaderActions
            key={ETeamspaceNavigationItem.PAGES}
            teamspaceId={teamspaceId}
            permissions={{ canCreatePage: permissions.getCanCreatePage(workspaceSlug) }}
          />,
        ],
        [
          ETeamspaceNavigationItem.PROJECTS,
          <TeamspaceProjectListHeaderActions
            key={ETeamspaceNavigationItem.PROJECTS}
            teamspaceId={teamspaceId}
            permissions={{ canAddProject: permissions.getCanAddProject(workspaceSlug, teamspaceId) }}
          />,
        ],
      ]),
    [teamspaceId, permissions, workspaceSlug]
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
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
                  icon={<TeamsIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : teamspace ? (
                    <BreadcrumbNavigationSearchDropdown
                      title={teamspace.name}
                      icon={
                        teamspace.logo_props ? (
                          <Logo logo={teamspace.logo_props} />
                        ) : (
                          <TeamsIcon className="h-4 w-4 text-tertiary" />
                        )
                      }
                      selectedItem={teamspaceId?.toString() || ""}
                      navigationItems={TEAMSPACE_SEARCH_OPTIONS}
                      onChange={(value: string) => {
                        router.push(`/${workspaceSlug}/teamspaces/${value}/`);
                      }}
                      handleOnClick={() => {
                        router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/`);
                      }}
                    />
                  ) : null}
                </>
              }
              showSeparator={false}
            />
            <Breadcrumbs.Item
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
