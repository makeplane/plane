import React from "react";
import { observer } from "mobx-react";
import useSWR from "swr";

import { TPageInstance } from "@/store/pages/base-page";
import { PageCommentDisplay } from "./comment-display";

type ThreadRepliesProps = {
  threadId: string;
  showReplies: boolean;
  page: TPageInstance;
};

export const PageCommentThreadReplyList: React.FC<ThreadRepliesProps> = observer(({ threadId, showReplies, page }) => {
  // Fetch thread comments when showReplies is true
  const { isLoading } = useSWR(
    showReplies && threadId ? `THREAD-COMMENTS-${threadId}` : null,
    async () => {
      if (!threadId) return [];
      page.comments.fetchThreadComments(threadId);
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  if (!showReplies) return null;

  const replies = page.comments.getCommentsByParentId(threadId);
  console.log(replies);

  return (
    <div className="overflow-hidden animate-expand">
      {isLoading && replies.length === 0 ? (
        <div className="flex items-center justify-center py-3">
          <div className="text-xs text-custom-text-300">Loading replies...</div>
        </div>
      ) : (
        replies.map((reply) => (
          <div key={reply.id} className="relative w-full">
            <div className="size-6 relative flex items-center justify-center">
              <div aria-hidden className="pointer-events-none h-5 w-0.5 bg-custom-border-300" />
            </div>
            <PageCommentDisplay page={page} comment={reply} isParent={false} />
          </div>
        ))
      )}
    </div>
  );
});
