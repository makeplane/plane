import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useHashScroll } from "@plane/hooks";
import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { EIssueCommentAccessSpecifier } from "@plane/types";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { calculateTimeAgo, cn, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// local imports
import { CommentReactions } from "../comment-reaction";
import { CommentCardEditForm } from "./edit-form";
import { EmojiReactionButton, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import { Avatar, Tooltip } from "@plane/ui";
import { useMember } from "@/hooks/store/use-member";

export type TCommentCardDisplayProps = {
  activityOperations: TCommentsOperations;
  comment: TIssueComment;
  disabled: boolean;
  entityId: string;
  projectId?: string;
  readOnlyEditorRef: React.RefObject<EditorRefApi>;
  showAccessSpecifier: boolean;
  workspaceId: string;
  workspaceSlug: string;
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  renderFooter?: (ReactionsComponent: ReactNode | null) => ReactNode;
  renderQuickActions?: () => ReactNode;
};

export const CommentCardDisplay = observer(function CommentCardDisplay(props: TCommentCardDisplayProps) {
  const {
    activityOperations,
    comment,
    disabled,
    projectId,
    readOnlyEditorRef,
    showAccessSpecifier,
    workspaceId,
    workspaceSlug,
    isEditing = false,
    setIsEditing,
    renderFooter,
    renderQuickActions,
  } = props;
  // states
  const [highlightClassName, setHighlightClassName] = useState("");
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const userDetails = getUserDetails(comment?.actor);
  const displayName = comment?.actor_detail?.is_bot
    ? comment?.actor_detail?.first_name + `Bot`
    : (userDetails?.display_name ?? comment?.actor_detail?.display_name);
  const avatarUrl = userDetails?.avatar_url ?? comment?.actor_detail?.avatar_url;

  const userReactions = activityOperations.userReactions(comment.id);

  // navigation
  const pathname = usePathname();
  // derived values
  const commentBlockId = `comment-${comment?.id}`;
  // Check if there are any reactions to determine if we should render the footer
  const reactionIds = activityOperations.reactionIds(comment.id);
  const hasReactions = reactionIds && Object.keys(reactionIds).some((key) => reactionIds[key]?.length > 0);

  // scroll to comment
  const { isHashMatch } = useHashScroll({
    elementId: commentBlockId,
    pathname,
  });

  useEffect(() => {
    if (!isHashMatch) return;
    setHighlightClassName("border-accent-strong");
    const timeout = setTimeout(() => {
      setHighlightClassName("");
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isHashMatch]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!userReactions) return;
      // emoji is already in decimal string format from EmojiReactionPicker
      void activityOperations.react(comment.id, emoji, userReactions);
    },
    [activityOperations, comment.id, userReactions]
  );

  const shouldRenderReactions = hasReactions && !disabled;

  return (
    <div id={commentBlockId} className="relative flex flex-col gap-2">
      {showAccessSpecifier && (
        <div className="absolute right-2.5 top-2.5 z-[1] text-tertiary">
          {comment.access === EIssueCommentAccessSpecifier.INTERNAL ? (
            <LockIcon className="size-3" />
          ) : (
            <GlobeIcon className="size-3" />
          )}
        </div>
      )}
      <div className="flex relative w-full gap-2 items-center mb-3">
        <Avatar size="sm" name={displayName} src={getFileURL(avatarUrl)} className="shrink-0" />
        <div className="flex-1 flex flex-wrap items-center gap-1">
          <div className="text-caption-sm-medium">{displayName}</div>
          <div className="text-caption-sm-regular text-tertiary">
            commented{" "}
            <Tooltip
              tooltipContent={`${renderFormattedDate(comment.created_at)} at ${renderFormattedTime(comment.created_at)}`}
              position="bottom"
            >
              <span className="text-tertiary">
                {calculateTimeAgo(comment.created_at)}
                {comment.edited_at && " (edited)"}
              </span>
            </Tooltip>
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            <EmojiReactionPicker
              isOpen={isPickerOpen}
              handleToggle={setIsPickerOpen}
              onChange={handleEmojiSelect}
              disabled={disabled}
              label={<EmojiReactionButton onAddReaction={() => setIsPickerOpen(true)} />}
              placement="bottom-start"
            />
            {renderQuickActions ? renderQuickActions() : null}
          </div>
        )}
      </div>
      {isEditing && setIsEditing ? (
        <CommentCardEditForm
          activityOperations={activityOperations}
          comment={comment}
          isEditing={isEditing}
          readOnlyEditorRef={readOnlyEditorRef.current}
          setIsEditing={setIsEditing}
          projectId={projectId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <>
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
            parentClassName="border-none"
          />
          {shouldRenderReactions &&
            (renderFooter ? (
              renderFooter(
                <CommentReactions comment={comment} disabled={disabled} activityOperations={activityOperations} />
              )
            ) : (
              <CommentReactions comment={comment} disabled={disabled} activityOperations={activityOperations} />
            ))}
        </>
      )}
    </div>
  );
});
