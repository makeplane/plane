import React from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local components
import { PageCommentTimestampDisplay } from "./comment-timestamp-display";

type PageCommentUserDetailsProps = {
  userId: string;
  timestamp?: string;
  className?: string;
};

export const PageCommentUserDetails = observer(({ userId, timestamp, className = "" }: PageCommentUserDetailsProps) => {
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const memberDetails = getWorkspaceMemberDetails(userId);

  return (
    <div className={cn("flex items-baseline gap-2 flex-1", className)}>
      <div className="text-custom-text-100 text-sm font-medium truncate">{memberDetails?.member.display_name}</div>
      {timestamp && <PageCommentTimestampDisplay timestamp={timestamp} />}
    </div>
  );
});
