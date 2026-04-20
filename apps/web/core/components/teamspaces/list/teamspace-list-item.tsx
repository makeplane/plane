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
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";
// types
import type { TTeamspaceItemPermissions } from "@/store/teamspace/permissions/root";
// local imports
import { JoinTeamspaceButton } from "../actions/join-teamspace";
import { TeamProperties } from "../actions/properties";
import { TeamQuickActions } from "../actions/quick-actions";

type TeamspaceListItemProps = {
  teamspaceId: string;
  permissions: TTeamspaceItemPermissions;
};

export const TeamspaceListItem = observer(function TeamspaceListItem(props: TeamspaceListItemProps) {
  const { teamspaceId, permissions } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const parentRef = useRef(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // plane web hooks
  const { getTeamspaceById, isCurrentUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);

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
              <TeamProperties teamspaceId={teamspaceId} canAddProject={permissions.canAddProject} />
              <TeamQuickActions
                parentRef={parentRef}
                teamspaceId={teamspaceId}
                workspaceSlug={workspaceSlug.toString()}
                permissions={{ canEdit: permissions.canEdit, canDelete: permissions.canDelete }}
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
