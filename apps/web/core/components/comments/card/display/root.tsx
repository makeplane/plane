/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EmojiReactionButton, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import { IconButton } from "@plane/propel/icon-button";
import { ReplyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/propel/avatar";
import { calculateTimeAgo, cn, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { CommentCardDisplay as BaseCommentCardDisplay } from "@/components/comments/card/display/base";
import type { TCommentCardDisplayProps } from "@/components/comments/card/display/base";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import type { CommentRepliesRootHandle } from "../replies/root";
import { CommentRepliesRoot } from "../replies/root";
import { AgentCommentHeader } from "@/components/agents/comment-header";

type Props = TCommentCardDisplayProps & {
  enableReplies: boolean;
  isReply?: boolean;
};

export const CommentCardDisplay = observer(function CommentCardDisplay(props: Props) {
  const {
    entityId,
    comment,
    disabled,
    projectId,
    workspaceSlug,
    showAccessSpecifier,
    activityOperations,
    enableReplies,
    isReply = false,
    renderQuickActions,
    ...restProps
  } = props;
  // refs
  const repliesRootRef = useRef<CommentRepliesRootHandle>(null);
  const editorRef = useRef<EditorRefApi>(null);
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

  const handleReply = useCallback(() => {
    repliesRootRef.current?.showReplyEditor();
  }, []);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!userReactions) return;
      // emoji is already in decimal string format from EmojiReactionPicker
      void activityOperations.react(comment.id, emoji, userReactions);
    },
    [activityOperations, comment.id, userReactions]
  );

  const areRepliesAvailable = comment.reply_count !== undefined && comment.reply_count > 0;
  const shouldShowIndicator = isReply || areRepliesAvailable;

  return (
    <>
      {comment?.agent_run && <AgentCommentHeader comment={comment} workspaceSlug={workspaceSlug} />}
      <div className={cn("relative", isReply && "pt-2")}>
        {shouldShowIndicator && (
          <div
            className="absolute left-[8px] top-1 -bottom-1 w-px transition-border duration-1000 bg-layer-1-active"
            aria-hidden
          />
        )}
        <div className="flex relative w-full gap-2 items-center mb-3">
          <div className="shrink-0">
            <Avatar size="sm" name={displayName} src={getFileURL(avatarUrl)} />
          </div>
          <div className="flex-1 flex flex-wrap items-center gap-1">
            <div className="text-caption-sm-medium">{displayName}</div>
            <div className="text-caption-sm-regular text-tertiary">
              {isReply ? "replied " : "commented "}
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
              {enableReplies && <IconButton variant="ghost" size="sm" icon={ReplyIcon} onClick={handleReply} />}
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
        {/* Core: Comment content */}
        <div className="ml-4">
          <BaseCommentCardDisplay
            {...restProps}
            entityId={entityId}
            comment={comment}
            disabled={disabled}
            workspaceSlug={workspaceSlug}
            activityOperations={activityOperations}
            showAccessSpecifier={showAccessSpecifier}
            renderHeader={false}
          />
        </div>
      </div>
      {enableReplies && !isReply && projectId && (
        <CommentRepliesRoot
          editorRef={editorRef}
          ref={repliesRootRef}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          entityId={entityId}
          activityOperations={activityOperations}
          commentId={comment.id}
          repliesCount={comment.reply_count || 0}
          repliedUserIds={comment.replied_user_ids || []}
          lastReplyAt={comment.last_reply_at || null}
          showAccessSpecifier={showAccessSpecifier}
        />
      )}
    </>
  );
});
