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
import { CommentBlock as BlocksCommentBlock } from "@plane/blocks/activity";
import type { EditorRefApi } from "@plane/editor";
import { EmojiReactionButton, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import { IconButton } from "@plane/propel/icon-button";
import { ReplyIcon } from "@plane/propel/icons";
import { Avatar } from "@plane/propel/avatar";
import type { TCommentsOperations } from "@plane/types";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// components
import { CommentCardDisplay as BaseCommentCardDisplay } from "@/components/comments/card/display/base";
import { AgentCommentHeader } from "@/components/agents/comment-header";
import { CommentQuickActions } from "@/components/comments/quick-actions";
import type { CommentRepliesRootHandle } from "@/components/comments/card/replies/root";
import { CommentRepliesRoot } from "@/components/comments/card/replies/root";
// hooks
import { useActivityHighlight } from "@/hooks/use-activity-highlight";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";

export type ActivityCommentItemProps = {
  commentId: string;
  workspaceSlug: string;
  issueId: string;
  projectId: string;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canReact: boolean;
  };
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  showConnector: boolean;
  activityOperations: TCommentsOperations;
};

export const ActivityCommentItem = observer(function ActivityCommentItem(props: ActivityCommentItemProps) {
  const {
    commentId,
    workspaceSlug,
    issueId,
    projectId,
    permissions,
    showAccessSpecifier,
    showCopyLinkOption,
    showConnector,
    activityOperations,
  } = props;

  // Store access
  const {
    comment: { getCommentById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { highlightRef, isHighlighted } = useActivityHighlight(commentId);
  const comment = getCommentById(commentId);

  // Component state
  const [isEditing, setIsEditing] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const editorRef = useRef<EditorRefApi>(null);
  const repliesRootRef = useRef<CommentRepliesRootHandle>(null);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!comment) return;
      const userReactions = activityOperations.userReactions(comment.id);
      if (!userReactions) return;
      void activityOperations.react(comment.id, emoji, userReactions);
    },
    [activityOperations, comment]
  );

  const handleReply = useCallback(() => {
    repliesRootRef.current?.showReplyEditor();
  }, []);

  if (!comment) return null;

  const userDetails = getUserDetails(comment.actor);
  const displayName = comment.actor_detail?.is_bot
    ? comment.actor_detail.first_name + "Bot"
    : (userDetails?.display_name ?? comment.actor_detail?.display_name ?? "");
  const avatarUrl = userDetails?.avatar_url ?? comment.actor_detail?.avatar_url;
  const workspaceId = comment.workspace;

  if (!workspaceId) return null;

  return (
    <>
      {comment.agent_run && <AgentCommentHeader comment={comment} workspaceSlug={workspaceSlug} />}
      <BlocksCommentBlock
        avatar={<Avatar name={displayName} src={avatarUrl ? getFileURL(avatarUrl) : undefined} size="sm" />}
        authorName={displayName}
        action="commented"
        timestamp={calculateTimeAgo(comment.created_at)}
        isEdited={!!comment.edited_at}
        showConnector={showConnector}
        highlightRef={highlightRef}
        highlighted={isHighlighted}
        headerActionsElement={
          <div className="flex items-center gap-1 shrink-0">
            {projectId && permissions.canCreate && (
              <IconButton variant="ghost" size="sm" icon={ReplyIcon} onClick={handleReply} />
            )}
            {permissions.canReact && (
              <EmojiReactionPicker
                isOpen={isPickerOpen}
                handleToggle={setIsPickerOpen}
                onChange={handleEmojiSelect}
                disabled={!permissions.canReact}
                label={<EmojiReactionButton onAddReaction={() => setIsPickerOpen(true)} />}
                placement="bottom-start"
              />
            )}
            <CommentQuickActions
              activityOperations={activityOperations}
              comment={comment}
              setEditMode={() => setIsEditing(true)}
              showAccessSpecifier={showAccessSpecifier}
              showCopyLinkOption={showCopyLinkOption}
            />
          </div>
        }
        body={
          <BaseCommentCardDisplay
            renderHeader={false}
            comment={comment}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            entityId={issueId}
            permissions={permissions}
            activityOperations={activityOperations}
            showAccessSpecifier={showAccessSpecifier}
            readOnlyEditorRef={editorRef}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        }
        footerElement={
          projectId ? (
            <CommentRepliesRoot
              ref={repliesRootRef}
              editorRef={editorRef}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              entityId={issueId}
              activityOperations={activityOperations}
              commentId={comment.id}
              repliesCount={comment.reply_count || 0}
              repliedUserIds={comment.replied_user_ids || []}
              lastReplyAt={comment.last_reply_at || null}
              showAccessSpecifier={showAccessSpecifier}
              permissions={permissions}
            />
          ) : undefined
        }
      />
    </>
  );
});
