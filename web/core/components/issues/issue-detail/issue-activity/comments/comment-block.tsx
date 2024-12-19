import { FC, ReactNode, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// ui
import { GithubIcon, SlackIcon } from "@plane/ui";
// helpers
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@/constants/notification";
import { cn } from "@/helpers/common.helper";
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useIssueDetail, useWorkspaceNotifications } from "@/hooks/store";

type TIssueCommentBlock = {
  commentId: string;
  ends: "top" | "bottom" | undefined;
  quickActions: ReactNode;
  children: ReactNode;
};

export const IssueCommentBlock: FC<TIssueCommentBlock> = observer((props) => {
  const { commentId, ends, quickActions, children } = props;
  const commentBlockRef = useRef<HTMLDivElement>(null);
  // hooks
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();
  const {
    comment: { getCommentById },
  } = useIssueDetail();

  const comment = getCommentById(commentId);
  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === commentId) {
      if (commentBlockRef.current) {
        commentBlockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        // reset highlighted activity ids after 5 seconds
        setTimeout(() => {
          setHighlightedActivityIds([]);
        }, ACTIVITY_HIGHLIGHT_TIMEOUT);
      }
    }
  }, [higlightedActivityIds, commentId]);
  if (!comment) return <></>;
  return (
    <div
      className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}
      ref={commentBlockRef}
    >
      <div
        className="absolute left-[13px] top-0 bottom-0 w-0.5 transition-border duration-1000 bg-custom-background-80"
        aria-hidden
      />
      <div
        className={cn(
          "flex-shrink-0 relative w-7 h-7 rounded-full transition-border duration-1000 flex justify-center items-center z-[3] bg-gray-500 text-white border border-white uppercase font-medium",
          higlightedActivityIds.includes(commentId) ? "border-2 border-custom-primary-100" : ""
        )}
      >
        {comment.actor_detail.avatar_url && comment.actor_detail.avatar_url !== "" ? (
          <img
            src={getFileURL(comment.actor_detail.avatar_url)}
            alt={
              comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name
            }
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-custom-border-200"
          />
        ) : (
          <>
            {comment.actor_detail.is_bot
              ? comment.actor_detail.first_name.charAt(0)
              : comment.actor_detail.display_name.charAt(0)}
          </>
        )}
        <div
          className={cn(
            "absolute top-2 left-4 w-5 h-5 rounded-full overflow-hidden flex justify-center items-center bg-custom-background-90",
            {
              "bg-custom-background-80": !comment.external_source,
            }
          )}
        >
          {comment.external_source === "GITHUB" ? (
            <GithubIcon className="w-4 h-4 absolute left-1 top-1" color="white" />
          ) : comment.external_source?.includes("SLACK") ? (
            <SlackIcon className="size-3 absolute left-1 top-1" />
          ) : (
            <MessageCircle className="w-3 h-3 text-custom-text-200" />
          )}
        </div>
      </div>
      <div className="w-full truncate relative flex ">
        <div className="w-full truncate space-y-1">
          <div>
            <div className="text-xs capitalize">
              {comment.actor_detail.is_bot
                ? comment.actor_detail.first_name + " Bot"
                : comment.actor_detail.display_name}
            </div>
            <div className="text-xs text-custom-text-200">commented {calculateTimeAgo(comment.created_at)}</div>
          </div>
          <div>{children}</div>
        </div>
        <div className="flex-shrink-0 ">{quickActions}</div>
      </div>
    </div>
  );
});
