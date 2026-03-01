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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Loader as Spinner, Users } from "lucide-react";
import { CycleIcon, WorkItemsIcon, PageIcon, ProjectIcon, ViewsIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import type { Props } from "@/components/icons/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { TeamsPropertiesList } from "./list";
import { TeamspaceEntitiesLoader } from "./loader";

type TTeamsOverviewSidebarPropertiesProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export type TPropertyListItem = {
  key: string;
  label: string;
  icon: React.FC<Props>;
  value: React.ReactNode;
  href?: string;
};

export const TeamsOverviewSidebarProperties = observer(function TeamsOverviewSidebarProperties(
  props: TTeamsOverviewSidebarPropertiesProps
) {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamspaceById, getTeamspaceEntitiesById, getTeamspaceEntitiesLoaderById, updateTeamspace } =
    useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const teamspaceEntities = getTeamspaceEntitiesById(teamspaceId);
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const linkedEntitiesCount = teamspaceEntities?.linked_entities.total;
  const teamspaceEntitiesCount = teamspaceEntities?.team_entities.total;
  const userIdsWithAdminOrMemberRole = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const memberDetails = getWorkspaceMemberDetails(userId);
        return memberDetails?.role === EUserWorkspaceRoles.GUEST ? false : true;
      }),
    [workspaceMemberIds, getWorkspaceMemberDetails]
  );

  if (!teamspace) return null;

  const handleTeamspaceLeadChange = useCallback(
    (val: string | null) => {
      if (val && val !== teamspace.lead_id) {
        updateTeamspace(workspaceSlug?.toString(), teamspaceId, { lead_id: val });
      } else {
        updateTeamspace(workspaceSlug?.toString(), teamspaceId, { lead_id: undefined });
      }
    },
    [teamspaceId, teamspace.lead_id, updateTeamspace, workspaceSlug]
  );

  const TEAM_PROPERTIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "lead",
        label: "Lead",
        icon: Users,
        value: (
          <MemberDropdown
            value={teamspace.lead_id ?? null}
            memberIds={userIdsWithAdminOrMemberRole}
            onChange={handleTeamspaceLeadChange}
            multiple={false}
            buttonVariant="transparent-with-text"
            buttonContainerClassName={cn(
              "flex-shrink-0 w-full text-left",
              teamspace.lead_id ? "text-secondary" : "text-placeholder"
            )}
            placeholder="Select team lead"
            showUserDetails
            disabled={!isEditingAllowed}
          />
        ),
      },
    ],
    [handleTeamspaceLeadChange, teamspace.lead_id, userIdsWithAdminOrMemberRole, isEditingAllowed]
  );

  const LINKED_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "projects",
        label: "Projects",
        icon: ProjectIcon,
        value: teamspaceEntities?.linked_entities.projects,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/projects`,
      },
      {
        key: "issues",
        label: "Work items",
        icon: WorkItemsIcon,
        value: teamspaceEntities?.linked_entities.issues,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/issues`,
      },
      {
        key: "cycles",
        label: "Cycles",
        icon: CycleIcon,
        value: teamspaceEntities?.linked_entities.cycles,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`,
      },
    ],
    [teamspaceId, teamspaceEntities, workspaceSlug]
  );

  const TEAM_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "views",
        label: "Views",
        icon: ViewsIcon,
        value: teamspaceEntities?.team_entities.views,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/views`,
      },
      {
        key: "pages",
        label: "Pages",
        icon: PageIcon,
        value: teamspaceEntities?.team_entities.pages,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/pages`,
      },
    ],
    [teamspaceId, teamspaceEntities, workspaceSlug]
  );

  return (
    <div className="relative flex flex-col gap-y-2 divide-y divide-subtle-1">
      <div className=" flex flex-col gap-2">
        <div className="flex gap-2 justify-between">
          <span className="text-body-xs-semibold">Properties</span>
          {teamspaceEntitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
        </div>
        <TeamsPropertiesList>
          {TEAM_PROPERTIES.map((property) => (
            <TeamsPropertiesList.Item
              key={property.key}
              label={property.label}
              icon={property.icon}
              value={property.value}
            />
          ))}
        </TeamsPropertiesList>
      </div>
      {/* Linked entities */}
      <div className="pt-3">
        <div className="flex gap-4 text-body-xs-regular">
          <span className="font-semibold">Linked entities</span>
          {linkedEntitiesCount === 0 ? <span className="text-tertiary">{linkedEntitiesCount}</span> : null}
        </div>
        {teamspaceEntitiesLoader === "init-loader" ? (
          <TeamspaceEntitiesLoader count={4} />
        ) : linkedEntitiesCount ? (
          <TeamsPropertiesList>
            {LINKED_ENTITIES.map((property) => (
              <TeamsPropertiesList.Item
                key={property.key}
                label={property.label}
                icon={property.icon}
                value={property.value}
                href={property.href}
              />
            ))}
          </TeamsPropertiesList>
        ) : null}
      </div>
      {/* Teamspace's entities */}
      <div className="pt-3">
        <div className="flex gap-4 text-body-xs-regular">
          <span className="font-semibold">Entities in the teamspace</span>
          {teamspaceEntitiesCount === 0 ? <span className="text-tertiary">{teamspaceEntitiesCount}</span> : null}
        </div>
        {teamspaceEntitiesLoader === "init-loader" ? (
          <TeamspaceEntitiesLoader count={2} />
        ) : teamspaceEntitiesCount ? (
          <TeamsPropertiesList>
            {TEAM_ENTITIES.map((property) => (
              <TeamsPropertiesList.Item
                key={property.key}
                label={property.label}
                icon={property.icon}
                value={property.value}
                href={property.href}
              />
            ))}
          </TeamsPropertiesList>
        ) : null}
      </div>
    </div>
  );
});
