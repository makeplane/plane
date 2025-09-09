import React from "react";
import { observer } from "mobx-react";
import useSWR from "swr";

import { TPageInstance } from "@/store/pages/base-page";
import { PageCommentDisplay } from "./comment-display";
import { PageCommentReplyLoadingSkeleton } from "./reply-loading-skeleton";

type ThreadRepliesProps = {
  threadId: string;
  showReplies: boolean;
  page: TPageInstance;
};

export const PageCommentThreadReplyList: React.FC<ThreadRepliesProps> = observer(({ threadId, showReplies, page }) => {
  const { fetchThreadComments, getCommentsByParentId, getLatestReplyByParentId } = page.comments;

  // Only fetch thread comments when showReplies is true (user clicked to expand)
  const { isLoading } = useSWR(
    showReplies && threadId ? `THREAD-COMMENTS-${threadId}` : null,
    async () => {
      if (!threadId) return [];
      await fetchThreadComments(threadId);
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const replies = getCommentsByParentId(threadId);
  const latestReply = getLatestReplyByParentId(threadId);
  const parentComment = page.comments.getCommentById(threadId);

  const repliesToShow = showReplies ? replies : latestReply ? [latestReply] : [];

  return (
    <div className="overflow-hidden animate-expand">
      {isLoading && <PageCommentReplyLoadingSkeleton commentReplyCount={(parentComment?.total_replies || 1) - 1} />}
      {repliesToShow.map((reply, index) => (
        <div key={reply.id} className="relative w-full">
          {(index > 0 || parentComment?.total_replies === 1) && (
            <div className="size-6 relative flex items-center justify-center">
              <div aria-hidden className="pointer-events-none h-5 w-0.5 bg-custom-border-300" />
            </div>
          )}
          <PageCommentDisplay page={page} comment={reply} isParent={false} />
        </div>
      ))}
    </div>
  );
});
