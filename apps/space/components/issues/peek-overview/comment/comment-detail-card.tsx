/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { CloseOutline, MoreVerticalOutline, TickOutline } from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { ActivityCommentCard, ActivityCommentHeader, ActivityTimelineTimestamp } from "@plane/blocks/activity";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TIssuePublicComment } from "@plane/types";
import { calculateTimeAgo, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
import { CommentReactions } from "@/components/issues/peek-overview/comment/comment-reactions";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
  comment: TIssuePublicComment;
  /** Draw the timeline rail down to the next comment. */
  showConnector?: boolean;
};

export const CommentCard = observer(function CommentCard(props: Props) {
  const { anchor, comment, showConnector = true } = props;
  // store hooks
  const { peekId, deleteIssueComment, updateIssueComment, uploadCommentAsset } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { workspace: workspaceID } = usePublish(anchor);
  const isInIframe = useIsInIframe();
  const { t } = useTranslation();

  // states
  const [isEditing, setIsEditing] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const showEditorRef = useRef<EditorRefApi>(null);
  // form info
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<TIssuePublicComment>({
    defaultValues: { comment_html: comment.comment_html },
  });

  const handleDelete = () => {
    if (!anchor || !peekId) return;
    deleteIssueComment(anchor, peekId, comment.id);
  };

  const handleCommentUpdate = async (formData: TIssuePublicComment) => {
    if (!anchor || !peekId) return;
    updateIssueComment(anchor, peekId, comment.id, formData);
    setIsEditing(false);
    editorRef.current?.setEditorValue(formData.comment_html);
    showEditorRef.current?.setEditorValue(formData.comment_html);
  };

  const displayName = comment.actor_detail.is_bot
    ? comment.actor_detail.first_name + " Bot"
    : comment.actor_detail.display_name;
  const canManageComment = !isInIframe && currentUser?.id === comment?.actor_detail?.id;

  return (
    <ActivityCommentCard
      id={comment.id}
      showConnector={showConnector}
      avatar={
        <Avatar
          size="2xs"
          src={comment.actor_detail.avatar_url ? getFileURL(comment.actor_detail.avatar_url) : undefined}
          alt={displayName}
          fallback={displayName?.charAt(0)?.toUpperCase()}
        />
      }
      header={
        <ActivityCommentHeader
          author={displayName}
          action="commented"
          timestamp={
            <ActivityTimelineTimestamp
              tooltip={`${renderFormattedDate(comment.created_at)} at ${renderFormattedTime(comment.created_at)}`}
            >
              {calculateTimeAgo(comment.created_at)}
            </ActivityTimelineTimestamp>
          }
          actions={
            canManageComment ? (
              <Menu>
                <MenuTrigger
                  render={
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label={t("aria_labels.common.more_actions")}
                      icon={<Icon icon={<MoreVerticalOutline />} />}
                    />
                  }
                />
                <MenuContent side="bottom" align="end">
                  <MenuItem label={t("edit")} onClick={() => setIsEditing(true)} />
                  <MenuItem label={t("delete")} onClick={handleDelete} />
                </MenuContent>
              </Menu>
            ) : undefined
          }
        />
      }
      footer={isEditing ? undefined : <CommentReactions anchor={anchor} commentId={comment.id} />}
    >
      <div className="issue-comments-section p-0">
        <form
          onSubmit={handleSubmit(handleCommentUpdate)}
          className={`flex-col gap-2 ${isEditing ? "flex" : "hidden"}`}
        >
          <div>
            <Controller
              control={control}
              name="comment_html"
              render={({ field: { onChange, value } }) => (
                <LiteTextEditor
                  editable
                  anchor={anchor}
                  workspaceId={workspaceID?.toString() ?? ""}
                  onEnterKeyPress={handleSubmit(handleCommentUpdate)}
                  ref={editorRef}
                  id={comment.id}
                  initialValue={value}
                  value={null}
                  onChange={(comment_json, comment_html) => onChange(comment_html)}
                  isSubmitting={isSubmitting}
                  showSubmitButton={false}
                  uploadFile={async (blockId, file) => {
                    const { asset_id } = await uploadCommentAsset(file, anchor, comment.id);
                    return asset_id;
                  }}
                  displayConfig={{
                    fontSize: "small-font",
                  }}
                />
              )}
            />
          </div>
          <div className="flex gap-1 self-end">
            <IconButton
              type="submit"
              variant="primary"
              size="sm"
              aria-label={t("save")}
              disabled={isSubmitting}
              icon={<Icon icon={<TickOutline />} />}
            />
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("cancel")}
              onClick={() => setIsEditing(false)}
              icon={<Icon icon={<CloseOutline />} />}
            />
          </div>
        </form>
        <div className={isEditing ? "hidden" : ""}>
          <LiteTextEditor
            editable={false}
            anchor={anchor}
            workspaceId={workspaceID?.toString() ?? ""}
            ref={showEditorRef}
            id={comment.id}
            initialValue={comment.comment_html}
            parentClassName="border-none p-0"
            containerClassName="p-0!"
            displayConfig={{
              fontSize: "small-font",
            }}
          />
        </div>
      </div>
    </ActivityCommentCard>
  );
});
