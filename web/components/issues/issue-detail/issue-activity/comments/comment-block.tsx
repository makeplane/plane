import { FC, ReactNode } from "react";
import { MessageCircle } from "lucide-react";
// hooks
import { useIssueDetail } from "hooks/store";
// helpers
import { calculateTimeAgo } from "helpers/date-time.helper";

type TIssueCommentBlock = {
  commentId: string;
  ends: "top" | "bottom" | undefined;
  quickActions: ReactNode;
  children: ReactNode;
};

export const IssueCommentBlock: FC<TIssueCommentBlock> = (props) => {
  const { commentId, ends, quickActions, children } = props;
  // hooks
  const {
    comment: { getCommentById },
  } = useIssueDetail();

  const comment = getCommentById(commentId);

  if (!comment) return <></>;
  return (
    <div className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}>
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden={true} />
      <div className="flex-shrink-0 relative w-7 h-7 rounded-full flex justify-center items-center z-10 bg-gray-500 text-white border border-white uppercase font-medium">
        {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
          <img
            src={comment.actor_detail.avatar}
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
        <div className="absolute top-2 left-4 w-5 h-5 rounded-full overflow-hidden flex justify-center items-center bg-custom-background-80">
          <MessageCircle className="w-3 h-3" color="#6b7280" />
        </div>
      </div>
      <div className="w-full relative flex ">
        <div className="w-full space-y-1">
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
};
