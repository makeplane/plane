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

import { useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { cn, isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";
// services init
const fileService = new FileService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  entityId: string;
  commentId: string;
  activityOperations: TCommentsOperations;
};

export const ReplyCreate = observer(function ReplyCreate(props: Props) {
  const { editorRef, workspaceSlug, projectId, entityId, commentId, activityOperations } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id;
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TIssueComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });

  const onSubmit = async (formData: Partial<TIssueComment>) => {
    try {
      const reply = await activityOperations.replyOperations?.createReply(commentId, formData);
      if (reply?.id) {
        // Reset form and hide editor after successful creation
        reset({
          comment_html: "<p></p>",
        });
        editorRef.current?.clearEditor();

        // Update asset upload status if needed
        if (uploadedAssetIds.length > 0) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, entityId, {
            asset_ids: uploadedAssetIds,
          });
          setUploadedAssetIds([]);
        }
      }
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML);

  if (!workspaceId) return null;

  return (
    <div
      className={cn("mt-2")}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !isEmpty &&
          !isSubmitting &&
          editorRef.current?.isEditorReadyToDiscard()
        )
          handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <LiteTextEditor
                editable
                workspaceId={workspaceId}
                id={`add_reply_${commentId}`}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                value={null}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-min"
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                isSubmitting={isSubmitting}
                uploadFile={async (blockId, file) => {
                  // Replies use comment endpoints for file uploads
                  const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
                  return asset_id;
                }}
                duplicateFile={async (assetId: string) => {
                  const { asset_id } = await activityOperations.duplicateCommentAsset(assetId);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
                  return asset_id;
                }}
                showToolbarInitially={false}
                parentClassName="p-2 bg-surface-1"
                placeholder={t("issue.comments.replies.create.placeholder")}
                displayConfig={{
                  fontSize: "small-font",
                }}
                submitButtonText={t("issue.comments.replies.create.submit_button")}
              />
            )}
          />
        )}
      />
    </div>
  );
});
