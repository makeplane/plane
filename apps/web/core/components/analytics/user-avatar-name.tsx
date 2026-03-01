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
import { UserRound } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { SuspendedUserIcon } from "@plane/propel/icons";
import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import { EUserWorkspaceRoles } from "@plane/types";
import { Avatar, Tooltip } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";

export const UserAvatarName = observer(function UserAvatarName({
  userId,
  showName = true,
}: {
  userId: string;
  showName?: boolean;
}) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const {
    getUserDetails,
    workspace: { isUserSuspended, getWorkspaceMemberDetails },
  } = useMember();
  const user = getUserDetails(userId);
  const isSuspended = workspaceSlug && isUserSuspended(userId, workspaceSlug);
  const workspaceMember = getWorkspaceMemberDetails(userId);

  // Get role badge text
  const getRoleBadge = () => {
    if (isSuspended) {
      return "Suspended";
    }

    if (!workspaceMember) return null;

    switch (workspaceMember.role) {
      case EUserWorkspaceRoles.ADMIN:
        return "Admin";
      case EUserWorkspaceRoles.MEMBER:
        return "Member";
      case EUserWorkspaceRoles.GUEST:
        return "Guest";
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <Tooltip tooltipContent={user?.display_name ?? t(`Unassigned`)}>
      <div className="flex items-center gap-2 min-w-0">
        {isSuspended ? (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-layer-1">
            <SuspendedUserIcon className="h-4 w-4 text-placeholder" />
          </div>
        ) : user?.avatar_url && user?.avatar_url !== "" ? (
          <Avatar
            className="shrink-0"
            name={user?.display_name}
            src={getFileURL(user?.avatar_url)}
            size={24}
            shape="circle"
          />
        ) : (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-layer-1 capitalize overflow-hidden">
            {user?.display_name ? user?.display_name?.[0] : <UserRound className="text-secondary" size={12} />}
          </div>
        )}
        {showName && (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex-1 truncate ${isSuspended ? "text-placeholder" : "text-secondary"}`}>
              {user?.display_name ?? t(`Unassigned`)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {roleBadge && (
                <Pill variant={EPillVariant.DEFAULT} size={EPillSize.XS} className="border-none">
                  {roleBadge}
                </Pill>
              )}
            </div>
          </div>
        )}
      </div>
    </Tooltip>
  );
});
