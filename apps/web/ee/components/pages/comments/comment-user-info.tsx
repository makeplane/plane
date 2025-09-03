import React from "react";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/ui";
import { getFileURL, cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local components
import { PageCommentTimestampDisplay } from "./comment-timestamp-display";

type UserAvatarProps = {
  size?: "sm" | "md";
  className?: string;
  userId: string;
  timestamp?: string;
};

export const PageCommentUserInfo = observer(({ userId, size = "sm", className = "", timestamp }: UserAvatarProps) => {
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const memberDetails = getWorkspaceMemberDetails(userId);

  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col items-center relative">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-full relative overflow-hidden",
            sizeClasses[size],
            className
          )}
        >
          <Avatar
            className="flex-1 self-stretch rounded-full object-cover"
            size="base"
            src={memberDetails?.member.avatar_url ? getFileURL(memberDetails?.member.avatar_url) : undefined}
            name={memberDetails?.member.display_name}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center items-start gap-px flex-1">
        <div className="text-custom-text-100 text-xs font-medium">{memberDetails?.member.display_name}</div>
        {timestamp && <PageCommentTimestampDisplay timestamp={timestamp} />}
      </div>
    </div>
  );
});
