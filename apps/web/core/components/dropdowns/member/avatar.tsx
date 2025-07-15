"use client";

import { observer } from "mobx-react";
import { LucideIcon, Users } from "lucide-react";
// plane ui
import { Avatar, AvatarGroup } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// plane utils
// helpers
// hooks
import { useMember } from "@/hooks/store";

type AvatarProps = {
  showTooltip: boolean;
  userIds: string | string[] | null;
  icon?: LucideIcon;
  size?: "sm" | "md" | "base" | "lg" | number;
};

export const ButtonAvatars: React.FC<AvatarProps> = observer((props) => {
  const { showTooltip, userIds, icon: Icon, size = "md" } = props;
  // store hooks
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroup size={size} showTooltip={!showTooltip}>
          {userIds.map((userId) => {
            const userDetails = getUserDetails(userId);

            if (!userDetails) return;
            return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return (
        <Avatar
          src={getFileURL(userDetails?.avatar_url ?? "")}
          name={userDetails?.display_name}
          size={size}
          showTooltip={!showTooltip}
        />
      );
    }
  }

  return Icon ? <Icon className="h-3 w-3 flex-shrink-0" /> : <Users className={cn("h-3 w-3 mx-[4px] flex-shrink-0")} />;
});
