import React from "react";
import { observer } from "mobx-react";
import { Avatar } from "@plane/ui";
import { getFileURL, cn } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";

type PageCommentAvatarProps = {
  userId: string;
  size?: "sm" | "md";
  className?: string;
};

export const PageCommentAvatar = observer(({ userId, size = "sm", className = "" }: PageCommentAvatarProps) => {
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const memberDetails = getWorkspaceMemberDetails(userId);

  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
  };

  return (
    <Avatar
      className={cn("shrink-0 rounded-full relative", sizeClasses[size], className)}
      size="base"
      src={memberDetails?.member.avatar_url ? getFileURL(memberDetails?.member.avatar_url) : undefined}
      name={memberDetails?.member.display_name}
    />
  );
});
