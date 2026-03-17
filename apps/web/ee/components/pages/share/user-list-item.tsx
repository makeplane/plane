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

import { useTheme } from "next-themes";
import { Avatar } from "@plane/propel/avatar";
import { cn, getFileURL } from "@plane/utils";
import { AccessMenu } from "./access-menu";

type TUserListItemProps = {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  access: number;
  isModified?: boolean;
  isOwner?: boolean;
  onUpdateAccess: (userId: string, access: number) => void;
  onRemove: (userId: string) => void;
  className?: string;
  canCurrentUserChangeAccess?: boolean;
};

export function UserListItem({
  userId,
  displayName,
  avatarUrl,
  access,
  isModified = false,
  isOwner = false,
  onUpdateAccess,
  onRemove,
  className = "",
  canCurrentUserChangeAccess = true,
}: TUserListItemProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar name={displayName || "Unknown User"} src={getFileURL(avatarUrl || "")} size="base" />
        <div className="min-w-0 flex-1">
          <p className="text-14 font-normal text-primary truncate">{displayName || "Unknown User"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isModified && (
          <span
            className={cn(
              "px-1 py-0.5 text-11 font-medium rounded-sm",
              { "text-[#FF9500] bg-[#804A00]": resolvedTheme === "dark" },
              { "text-[#FF9500] bg-[#FFEACC]": resolvedTheme === "light" }
            )}
          >
            Modified
          </span>
        )}
        <AccessMenu
          currentAccess={access}
          onUpdateAccess={(accessValue) => onUpdateAccess(userId, parseInt(accessValue))}
          onRemove={() => onRemove(userId)}
          isOwner={isOwner}
          canCurrentUserChangeAccess={canCurrentUserChangeAccess}
        />
      </div>
    </div>
  );
}

UserListItem.displayName = "UserListItem";
