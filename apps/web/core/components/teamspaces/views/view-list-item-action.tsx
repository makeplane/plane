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

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth } from "lucide-react";
// plane imports
import { LockIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TTeamspaceView } from "@plane/types";
import { EViewAccess } from "@plane/types";
import { FavoriteStar } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { TeamspaceViewQuickActions } from "@/components/teamspaces/views/quick-actions";
import { useTeamspaceViews } from "@/plane-web/hooks/store";
// types
import type { TTeamspaceViewItemPermissions } from "@/store/teamspace/permissions/root";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamspaceId: string;
  view: TTeamspaceView;
  permissions: TTeamspaceViewItemPermissions;
};

export const TeamspaceViewListItemAction = observer(function TeamspaceViewListItemAction(props: Props) {
  const { parentRef, teamspaceId, view, permissions } = props;
  // router
  const { workspaceSlug } = useParams();
  // store
  const { addViewToFavorites, removeViewFromFavorites } = useTeamspaceViews();
  const { getUserDetails } = useMember();
  const access = view.access;
  const isFavoriteOperationAllowed = false; // TODO: Favorite operation is not supported for teamspace views right now

  // handlers
  const handleAddToFavorites = () => {
    if (!workspaceSlug || !teamspaceId || !isFavoriteOperationAllowed) return;
    addViewToFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !teamspaceId || !isFavoriteOperationAllowed) return;
    removeViewFromFavorites(workspaceSlug.toString(), teamspaceId.toString(), view.id);
  };

  const ownedByDetails = view.owned_by ? getUserDetails(view.owned_by) : undefined;

  return (
    <>
      <div className="cursor-default text-tertiary">
        <Tooltip tooltipContent={access === EViewAccess.PUBLIC ? "Public" : "Private"}>
          {access === EViewAccess.PUBLIC ? <Earth className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
        </Tooltip>
      </div>

      {/* created by */}
      {<ButtonAvatars showTooltip={false} userIds={ownedByDetails?.id ?? []} />}

      {permissions.canEdit && isFavoriteOperationAllowed && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (view.is_favorite) handleRemoveFromFavorites();
            else handleAddToFavorites();
          }}
          selected={view.is_favorite}
        />
      )}
      {view && workspaceSlug && (
        <div className="hidden md:block">
          <TeamspaceViewQuickActions
            parentRef={parentRef}
            teamspaceId={teamspaceId}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
            permissions={permissions}
          />
        </div>
      )}
    </>
  );
});
