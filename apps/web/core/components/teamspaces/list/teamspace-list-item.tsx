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

import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Logo } from "@plane/propel/emoji-icon-picker";
import { TeamsIcon } from "@plane/propel/icons";
// components
import { ListItem } from "@/components/core/list/list-item";
// hooks
import { useUser } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";
// local imports
import { JoinTeamspaceButton } from "../actions/join-teamspace";
import { TeamProperties } from "../actions/properties";
import { TeamQuickActions } from "../actions/quick-actions";

type TeamspaceListItemProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceListItem = observer(function TeamspaceListItem(props: TeamspaceListItemProps) {
  const { teamspaceId, isEditingAllowed: isEditingAllowedProp } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const parentRef = useRef(null);
  // hooks
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  // plane web hooks
  const { getTeamspaceById, isCurrentUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const isTeamspaceLead = currentUser?.id === teamspace?.lead_id;
  const isEditingAllowed = isEditingAllowedProp || isTeamspaceLead;

  if (!teamspace) return null;
  return (
    <ListItem
      title={teamspace.name}
      itemLink={`/${workspaceSlug?.toString()}/teamspaces/${teamspace.id}`}
      prependTitleElement={
        <div className="flex flex-shrink-0 size-8 items-center justify-center rounded-md bg-layer-1">
          {teamspace.logo_props?.in_use ? (
            <Logo logo={teamspace.logo_props} size={16} />
          ) : (
            <TeamsIcon className="size-4 text-tertiary" />
          )}
        </div>
      }
      quickActionElement={
        <>
          {isTeamspaceMember ? (
            <>
              <TeamProperties teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
              <TeamQuickActions
                parentRef={parentRef}
                teamspaceId={teamspaceId}
                workspaceSlug={workspaceSlug.toString()}
                isEditingAllowed={isEditingAllowed && isTeamspaceMember}
              />
            </>
          ) : (
            <JoinTeamspaceButton teamspaceId={teamspaceId} />
          )}
        </>
      }
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={!isTeamspaceMember}
    />
  );
});
