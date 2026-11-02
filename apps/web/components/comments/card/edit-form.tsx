/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { CommentBox } from "@plane/blocks/comment-box";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
import { IssueCommentToolbar } from "@/components/editor/lite-text/toolbar";

type Props = {
  activityOperations: TCommentsOperations;
  comment: TIssueComment;
  isEditing: boolean;
  projectId?: string;
  readOnlyEditorRef: EditorRefApi | null;
  setIsEditing: (isEditing: boolean) => void;
  workspaceId: string;
  workspaceSlug: string;
};

export const CommentCardEditForm = observer(function CommentCardEditForm(props: Props) {
  const {
    activityOperations,
    comment,
    isEditing,
    projectId,
    readOnlyEditorRef,
    setIsEditing,
    workspaceId,
    workspaceSlug,
  } = props;
  const { t } = useTranslation();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // states
  const [isEditorReady, setIsEditorReady] = useState(false);
  // form info
  const {
    formState: { isSubmitting },
    handleSubmit,
    setFocus,
    watch,
    setValue,
  } = useForm<Partial<TIssueComment>>({
    defaultValues: { comment_html: comment?.comment_html },
  });
  const commentHTML = watch("comment_html");

  const isEmpty = isCommentEmpty(commentHTML);
  const isEditorReadyToDiscard = editorRef.current?.isEditorReadyToDiscard();
  const canSubmit = !isEmpty && isEditorReady && !!isEditorReadyToDiscard;

  const onEnter = async (formData: Partial<TIssueComment>) => {
    if (isSubmitting || !comment) return;

    setIsEditing(false);

    await activityOperations.updateComment(comment.id, formData);

    editorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
    readOnlyEditorRef?.setEditorValue(formData?.comment_html ?? "<p></p>");
  };

  const handleCancel = () => {
    setIsEditing(false);
    editorRef.current?.setEditorValue(comment.comment_html ?? "<p></p>");
  };

  useEffect(() => {
    if (isEditing) {
      setFocus("comment_html");
    }
  }, [isEditing, setFocus]);

  return (
    <CommentBox
      submitLabel={t("save")}
      onSubmit={() => void handleSubmit(onEnter)()}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      toolbar={
        <div className="flex items-center gap-2 pr-2">
          <div className="min-w-0 flex-1">
            <IssueCommentToolbar
              executeCommand={(item) => {
                // TODO: update this while toolbar homogenization
                // @ts-expect-error type mismatch here
                editorRef.current?.executeMenuItemCommand({
                  itemKey: item.itemKey,
                  ...item.extraProps,
                });
              }}
              handleSubmit={() => void handleSubmit(onEnter)()}
              isCommentEmpty={isEmpty}
              isSubmitting={isSubmitting}
              showAccessSpecifier={false}
              showSubmitButton={false}
              editorRef={isEditorReady ? editorRef.current : null}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            stretch="auto"
            label={t("cancel")}
            disabled={isSubmitting}
            onClick={handleCancel}
          />
        </div>
      }
      editor={
        // Scoped to the editor so Enter on Cancel or a toolbar control activates it instead of saving.
        <div
          role="presentation"
          className="w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty) handleSubmit(onEnter)(e);
          }}
        >
          <LiteTextEditor
            editable
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            ref={editorRef}
            id={comment.id}
            initialValue={commentHTML ?? ""}
            value={null}
            handleEditorReady={setIsEditorReady}
            onChange={(_comment_json, comment_html) => setValue("comment_html", comment_html)}
            onEnterKeyPress={(e) => {
              if (!isEmpty && !isSubmitting) {
                handleSubmit(onEnter)(e);
              }
            }}
            showSubmitButton={false}
            uploadFile={async (blockId, file) => {
              const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file, comment.id);
              return asset_id;
            }}
            duplicateFile={async (assetId: string) => {
              const { asset_id } = await activityOperations.duplicateCommentAsset(assetId, comment.id);
              return asset_id;
            }}
            projectId={projectId}
            containerClassName="min-h-min max-h-[200px] overflow-y-auto overscroll-contain"
            variant="none"
            parentClassName="w-full rounded-none border-0 p-0"
            displayConfig={{
              fontSize: "small-font",
            }}
          />
        </div>
      }
    />
  );
});
