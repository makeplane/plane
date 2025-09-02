import React from "react";
import { observer } from "mobx-react";
import { TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { TPageInstance } from "@/store/pages/base-page";
import { PageThreadCommentItem } from "./thread-comment-item";

export type CommentsListProps = {
  comments: TCommentInstance[];
  page: TPageInstance;
  selectedThreadId?: string;
  onSetItemRef: (id: string) => (element: HTMLDivElement | null) => void;
};

export const PageCommentsThreadList = observer(
  ({ comments, page, selectedThreadId, onSetItemRef }: CommentsListProps) => (
    <div className="space-y-3 py-3 animate-stagger-comments">
      {comments.map((comment) => (
        <PageThreadCommentItem
          key={comment.id}
          ref={onSetItemRef(comment.id)}
          comment={comment}
          page={page}
          isSelected={selectedThreadId === comment.id}
          referenceText={comment.reference_stripped}
        />
      ))}
    </div>
  )
);
