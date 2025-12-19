import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EmojiReactionButton, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EditorRefApi } from "@plane/editor";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
// plane web imports
import { CommentBlock } from "@/plane-web/components/comments";
// local imports
import { CommentQuickActions } from "../quick-actions";
import { CommentCardDisplay } from "./display";
import { CommentCardEditForm } from "./edit-form";

type TCommentCard = {
  workspaceSlug: string;
  comment: TIssueComment | undefined;
  activityOperations: TCommentsOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  disabled?: boolean;
  projectId?: string;
};

export const CommentCard = observer(function CommentCard(props: TCommentCard) {
  const {
    workspaceSlug,
    comment,
    activityOperations,
    ends,
    showAccessSpecifier,
    showCopyLinkOption,
    disabled = false,
    projectId,
  } = props;
  // states
  const [isEditing, setIsEditing] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // refs
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // derived values
  const workspaceId = comment?.workspace;

  const userReactions = comment?.id ? activityOperations.userReactions(comment.id) : undefined;

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!userReactions || !comment?.id) return;
      // emoji is already in decimal string format from EmojiReactionPicker
      void activityOperations.react(comment.id, emoji, userReactions);
    },
    [activityOperations, comment?.id, userReactions]
  );

  if (!comment || !workspaceId) return null;

  return (
    <CommentBlock
      comment={comment}
      quickActions={
        !disabled && (
          <div className="flex items-center gap-1">
            <EmojiReactionPicker
              isOpen={isPickerOpen}
              handleToggle={setIsPickerOpen}
              onChange={handleEmojiSelect}
              disabled={disabled}
              label={<EmojiReactionButton onAddReaction={() => setIsPickerOpen(true)} />}
              placement="bottom-start"
            />

            <CommentQuickActions
              activityOperations={activityOperations}
              comment={comment}
              setEditMode={() => setIsEditing(true)}
              showAccessSpecifier={showAccessSpecifier}
              showCopyLinkOption={showCopyLinkOption}
            />
          </div>
        )
      }
      ends={ends}
    >
      {isEditing ? (
        <CommentCardEditForm
          activityOperations={activityOperations}
          comment={comment}
          isEditing
          readOnlyEditorRef={readOnlyEditorRef.current}
          setIsEditing={setIsEditing}
          projectId={projectId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <CommentCardDisplay
          activityOperations={activityOperations}
          comment={comment}
          disabled={disabled}
          projectId={projectId}
          readOnlyEditorRef={readOnlyEditorRef}
          showAccessSpecifier={showAccessSpecifier}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      )}
    </CommentBlock>
  );
});
