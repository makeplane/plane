import { FC, ReactNode, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TIssueComment } from "@plane/types";
import { Avatar, Tooltip } from "@plane/ui";
import { calculateTimeAgo, cn, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";

type TCommentBlock = {
  comment: TIssueComment;
  ends: "top" | "bottom" | undefined;
  quickActions: ReactNode;
  children: ReactNode;
};

export const CommentBlock: FC<TCommentBlock> = observer((props) => {
  const { comment, ends, quickActions, children } = props;
  // refs
  const commentBlockRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const userDetails = getUserDetails(comment?.actor);
  // translation
  const { t } = useTranslation();

  if (!comment || !userDetails) return null;

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
          "flex-shrink-0 relative w-7 h-6 rounded-full transition-border duration-1000 flex justify-center items-center z-[3] uppercase font-medium"
        )}
      >
        <Avatar
          size="base"
          name={userDetails?.display_name}
          src={getFileURL(userDetails?.avatar_url)}
          className="flex-shrink-0"
        />
      </div>
      <div className="flex flex-col gap-3 truncate flex-grow">
        <div className="flex w-full gap-2">
          <div className="flex-1 flex flex-wrap items-center gap-1">
            <div className="text-xs font-medium">
              {comment?.actor_detail?.is_bot
                ? comment?.actor_detail?.first_name + ` ${t("bot")}`
                : comment?.actor_detail?.display_name || userDetails.display_name}
            </div>
            <div className="text-xs text-custom-text-300">
              commented{" "}
              <Tooltip
                tooltipContent={`${renderFormattedDate(comment.created_at)} at ${renderFormattedTime(comment.created_at)}`}
                position="bottom"
              >
                <span className="text-custom-text-350">
                  {calculateTimeAgo(comment.updated_at)}
                  {comment.edited_at && ` (${t("edited")})`}
                </span>
              </Tooltip>
            </div>
          </div>
          <div className="flex-shrink-0 ">{quickActions}</div>
        </div>
        <div className="text-base mb-2">{children}</div>
      </div>
    </div>
  );
});
