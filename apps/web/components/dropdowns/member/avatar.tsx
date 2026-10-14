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
  const { showTooltip, userIds, icon: Icon, size = "xs" } = props;
  // store hooks
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    // Count only members that resolve, as the legacy overflow did: an id missing from the member map
    // (not loaded yet, or no longer a member) must neither inflate the "+N" nor hide a face after it.
    const members = userIds.flatMap((userId) => {
      const userDetails = getUserDetails(userId);
      return userDetails ? [{ userId, userDetails }] : [];
    });
    if (members.length > 0)
      // Render at most `max + 1` avatars: `AvatarGroup` shows the extra face only when it replaces a "+1" and
      // counts the rest from `total`. The parent's own tooltip replaces the per-avatar name tooltips.
      return (
        <AvatarGroup size={size} max={MAX_GROUP_AVATARS} total={members.length}>
          {members.slice(0, MAX_GROUP_AVATARS + 1).map(({ userId, userDetails }) => (
            <Avatar
              key={userId}
              src={getFileURL(userDetails.avatar_url)}
              alt={userDetails.display_name}
              tooltip={!showTooltip}
            />
          ))}
        </AvatarGroup>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return (
        <Avatar
          src={getFileURL(userDetails?.avatar_url ?? "")}
          alt={userDetails?.display_name}
          size={size}
          tooltip={!showTooltip}
        />
      );
    }
  }

  return Icon ? (
    <Icon className="h-3 w-3 flex-shrink-0" />
  ) : (
    <MembersOutline className={cn("mx-[4px] h-3 w-3 flex-shrink-0")} />
  );
});
