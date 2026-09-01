/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "@makeplane/propel/components/avatar";
import type { AvatarGroupSize } from "@makeplane/propel/components/avatar-group";
import { MembersPropertyIcon } from "@plane/propel/icons";
import { cn, getFileURL } from "@plane/utils";
// plane utils
// helpers
// hooks
import { AvatarGroupOverflow } from "@/components/common/avatar-group-overflow";
import { useMember } from "@/hooks/store/use-member";

type AvatarProps = {
  showTooltip: boolean;
  userIds: string | string[] | null;
  icon?: LucideIcon;
  size?: AvatarGroupSize;
};

export const ButtonAvatars = observer(function ButtonAvatars(props: AvatarProps) {
  const { userIds, icon: Icon, size = "xs" } = props;
  // store hooks
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroupOverflow size={size}>
          {userIds.map((userId) => {
            const userDetails = getUserDetails(userId);

            if (!userDetails) return;
            return (
              <Avatar
                key={userId}
                src={getFileURL(userDetails.avatar_url)}
                alt={userDetails.display_name}
                fallback={userDetails.display_name?.[0]?.toUpperCase()}
              />
            );
          })}
        </AvatarGroupOverflow>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return (
        <Avatar
          src={getFileURL(userDetails?.avatar_url ?? "")}
          alt={userDetails?.display_name}
          fallback={userDetails?.display_name?.[0]?.toUpperCase()}
          size={size}
        />
      );
    }
  }

  return Icon ? (
    <Icon className="h-3 w-3 flex-shrink-0" />
  ) : (
    <MembersPropertyIcon className={cn("mx-[4px] h-3 w-3 flex-shrink-0")} />
  );
});
