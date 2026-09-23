/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { ComponentType, SVGProps } from "react";
import { Avatar } from "@makeplane/propel/components/avatar";
import { AvatarGroup } from "@makeplane/propel/components/avatar-group";
import type { AvatarGroupSize } from "@makeplane/propel/components/avatar-group";
import { MembersOutline } from "@makeplane/propel/icons";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type AvatarProps = {
  showTooltip: boolean;
  userIds: string | string[] | null;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  size?: AvatarGroupSize;
};

const MAX_GROUP_AVATARS = 2;

export const ButtonAvatars = observer(function ButtonAvatars(props: AvatarProps) {
  const { userIds, icon: Icon, size = "xs" } = props;
  // store hooks
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      // Resolve at most `max + 1` avatars: `AvatarGroup` shows the extra face only when it replaces a "+1" and
      // counts the rest from `total`.
      return (
        <AvatarGroup size={size} max={MAX_GROUP_AVATARS} total={userIds.length}>
          {userIds.slice(0, MAX_GROUP_AVATARS + 1).map((userId) => {
            const userDetails = getUserDetails(userId);

            if (!userDetails) return null;
            return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} alt={userDetails.display_name} />;
          })}
        </AvatarGroup>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return <Avatar src={getFileURL(userDetails?.avatar_url ?? "")} alt={userDetails?.display_name} size={size} />;
    }
  }

  return Icon ? (
    <Icon className="h-3 w-3 flex-shrink-0" />
  ) : (
    <MembersOutline className={cn("mx-[4px] h-3 w-3 flex-shrink-0")} />
  );
});
