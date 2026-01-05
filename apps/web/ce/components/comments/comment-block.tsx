import type { ReactNode } from "react";
import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { CommentReplyIcon } from "@plane/propel/icons";
import type { TIssueComment } from "@plane/types";
import { cn } from "@plane/utils";
// hooks

type TCommentBlock = {
  comment: TIssueComment;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
};

export const CommentBlock = observer(function CommentBlock(props: TCommentBlock) {
  const { comment, ends, children } = props;
  const commentBlockRef = useRef<HTMLDivElement>(null);

  if (!comment) return null;
  return (
    <div
      id={comment.id}
      className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}
      ref={commentBlockRef}
    >
      <div
        className="absolute left-[13px] top-0 bottom-0 w-px transition-border duration-1000 bg-layer-3"
        aria-hidden
      />
      <div
        className={cn(
          "flex-shrink-0 relative w-7 h-7  rounded-lg transition-border duration-1000 flex justify-center items-center z-[3] uppercase shadow-raised-100 bg-layer-2 border border-subtle"
        )}
      >
        <CommentReplyIcon width={14} height={14} className="text-secondary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-3 truncate flex-grow">
        <div className="text-body-sm-regular mb-2 bg-layer-2 border border-subtle shadow-raised-100 rounded-lg p-3">
          {children}
        </div>
      </div>
    </div>
  );
});
