import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Globe2, Lock } from "lucide-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useHashScroll } from "@plane/hooks";
import { EIssueCommentAccessSpecifier, type TCommentsOperations, type TIssueComment } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// local imports
import { CommentReactions } from "../comment-reaction";

type Props = {
  activityOperations: TCommentsOperations;
  comment: TIssueComment;
  disabled: boolean;
  projectId?: string;
  readOnlyEditorRef: React.RefObject<EditorRefApi>;
  showAccessSpecifier: boolean;
  workspaceId: string;
  workspaceSlug: string;
};

export const CommentCardDisplay: React.FC<Props> = observer((props) => {
  const {
    activityOperations,
    comment,
    disabled,
    projectId,
    readOnlyEditorRef,
    showAccessSpecifier,
    workspaceId,
    workspaceSlug,
  } = props;
  // states
  const [highlightClassName, setHighlightClassName] = useState("");
  // navigation
  const pathname = usePathname();
  // derived values
  const commentBlockId = `comment-${comment?.id}`;
  // scroll to comment
  const { isHashMatch } = useHashScroll({
    elementId: commentBlockId,
    pathname,
  });

  useEffect(() => {
    if (!isHashMatch) return;
    setHighlightClassName("border-custom-primary-100");
    const timeout = setTimeout(() => {
      setHighlightClassName("");
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isHashMatch]);

  return (
    <div id={commentBlockId} className="relative flex flex-col gap-2">
      {showAccessSpecifier && (
        <div className="absolute right-2.5 top-2.5 z-[1] text-custom-text-300">
          {comment.access === EIssueCommentAccessSpecifier.INTERNAL ? (
            <Lock className="size-3" />
          ) : (
            <Globe2 className="size-3" />
          )}
        </div>
      )}
      <LiteTextEditor
        editable={false}
        ref={readOnlyEditorRef}
        id={comment.id}
        initialValue={comment.comment_html ?? ""}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        containerClassName={cn("!py-1 transition-[border-color] duration-500", highlightClassName)}
        projectId={projectId?.toString()}
        displayConfig={{
          fontSize: "small-font",
        }}
      />
      <CommentReactions comment={comment} disabled={disabled} activityOperations={activityOperations} />
    </div>
  );
});
