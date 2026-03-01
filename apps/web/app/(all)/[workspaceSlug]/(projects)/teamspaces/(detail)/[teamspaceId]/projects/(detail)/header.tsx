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
import { useParams } from "next/navigation";
// plane imports
import { ETeamspaceNavigationItem, EUserPermissionsLevel } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon, TeamsIcon } from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header, Loader } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// plane web hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { TeamspaceProjectDetailHeaderActions } from "@/components/teamspaces/headers/detail-header/work-items";
import { useTeamspaces } from "@/plane-web/hooks/store";

export const TeamspaceProjectDetailHeader = observer(function TeamspaceProjectDetailHeader() {
  // router
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // store hooks
  const { loader, getTeamspaceById } = useTeamspaces();
  const { getPartialProjectById } = useProject();
  const router = useAppRouter();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  // derived values
  const teamspaceProjectIds = teamspace?.project_ids;
  const switcherOptions = teamspaceProjectIds?.length
    ? (teamspaceProjectIds
        .map((projectId) => {
          const project = getPartialProjectById(projectId.toString());
          return {
            value: projectId,
            query: project?.name,
            content: <SwitcherLabel name={project?.name} logo_props={project?.logo_props} LabelIcon={ProjectIcon} />,
          };
        })
        .filter((option) => option !== undefined) as ICustomSearchSelectOption[])
    : [];

  const currentProjectDetails = getPartialProjectById(projectId?.toString());

  const hasAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
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
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/projects`}
                  label="Projects"
                  icon={<ProjectIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={projectId?.toString()}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/projects/${value}`);
                  }}
                  title={currentProjectDetails?.name}
                  icon={currentProjectDetails?.logo_props && <Logo logo={currentProjectDetails?.logo_props} />}
                  isLast
                />
              }
              showSeparator={false}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <TeamspaceProjectDetailHeaderActions
          key={ETeamspaceNavigationItem.PROJECTS}
          teamspaceId={teamspaceId?.toString()}
          isEditingAllowed={hasAdminLevelPermissions}
          projectId={projectId?.toString()}
        />
      </Header.RightItem>
    </Header>
  );
});
