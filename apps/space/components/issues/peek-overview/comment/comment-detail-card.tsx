/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ChatOutline, CloseOutline, MoreVerticalOutline, TickOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TIssuePublicComment } from "@plane/types";
import { getFileURL } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
import { CommentReactions } from "@/components/issues/peek-overview/comment/comment-reactions";
// helpers
import { timeAgo } from "@/helpers/date-time.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
  comment: TIssuePublicComment;
};

export const CommentCard = observer(function CommentCard(props: Props) {
  const { anchor, comment } = props;
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

  return (
    <div className="relative flex items-start space-x-3">
      <div className="relative px-1">
        {comment.actor_detail.avatar_url && comment.actor_detail.avatar_url !== "" ? (
          <img
            src={getFileURL(comment.actor_detail.avatar_url)}
            alt={
              comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name
            }
            height={30}
            width={30}
            className="grid size-7 place-items-center rounded-full border-2 border-strong-1"
          />
        ) : (
          <div
            className={`bg-gray-500 grid size-7 place-items-center rounded-full border-2 border-strong-1 text-on-color`}
          >
            {comment.actor_detail.is_bot
              ? comment?.actor_detail?.first_name?.charAt(0)
              : comment?.actor_detail?.display_name?.charAt(0)}
          </div>
        )}

        <span className="absolute -right-1 -bottom-0.5 rounded-tl-sm bg-layer-1 px-0.5 py-px">
          <ChatOutline className="size-3 text-secondary" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div>
          <div className="text-11">
            {comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name}
          </div>
          <p className="mt-0.5 text-11 text-secondary">
            <>commented {timeAgo(comment.created_at)}</>
          </p>
        </div>
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="group shadow-md rounded-sm border border-success-strong bg-success-primary p-2 duration-300 hover:bg-success-primary"
              >
                <TickOutline className="h-3 w-3 text-on-color" />
              </button>
              <button
                type="button"
                className="group shadow-md rounded-sm border border-danger-strong bg-danger-primary p-2 duration-300 hover:bg-danger-primary-hover"
                onClick={() => setIsEditing(false)}
              >
                <CloseOutline className="h-3 w-3 text-on-color" />
              </button>
            </div>
          </form>
          <div className={`${isEditing ? "hidden" : ""}`}>
            <LiteTextEditor
              editable={false}
              anchor={anchor}
              workspaceId={workspaceID?.toString() ?? ""}
              ref={showEditorRef}
              id={comment.id}
              initialValue={comment.comment_html}
              displayConfig={{
                fontSize: "small-font",
              }}
            />
            <CommentReactions anchor={anchor} commentId={comment.id} />
          </div>
        </div>
      </div>
      {!isInIframe && currentUser?.id === comment?.actor_detail?.id && (
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
      )}
    </div>
  );
});
