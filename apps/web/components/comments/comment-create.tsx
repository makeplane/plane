/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { CommentBox } from "@plane/blocks/comment-box";
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
import { isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
import { IssueCommentToolbar } from "@/components/editor/lite-text/toolbar";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";

type TCommentCreate = {
  entityId: string;
  workspaceSlug: string;
  activityOperations: TCommentsOperations;
  projectId?: string;
  onSubmitCallback?: (elementId: string) => void;
};

// services
const fileService = new FileService();

export const CommentCreate = observer(function CommentCreate(props: TCommentCreate) {
  const { workspaceSlug, entityId, activityOperations, projectId, onSubmitCallback } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [isEditorReady, setIsEditorReady] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;
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
      const comment = await activityOperations.createComment(formData);
      if (comment?.id) onSubmitCallback?.(comment.id);
      if (uploadedAssetIds.length > 0) {
        if (projectId) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId.toString(), entityId, {
            asset_ids: uploadedAssetIds,
          });
        } else {
          await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, entityId, {
            asset_ids: uploadedAssetIds,
          });
        }
        setUploadedAssetIds([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      reset({
        comment_html: "<p></p>",
      });
      editorRef.current?.clearEditor();
    }
  };

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);
  const canSubmit = !isEmpty && isEditorReady && !!editorRef.current?.isEditorReadyToDiscard();

  return (
    <div
      className="sticky bottom-0 z-[4] bg-surface-1 sm:static"
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
              <CommentBox
                submitLabel={t("common.comment")}
                onSubmit={() => void handleSubmit(onSubmit)()}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                toolbar={
                  <IssueCommentToolbar
                    accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                    handleAccessChange={onAccessChange}
                    executeCommand={(item) => {
                      // TODO: update this while toolbar homogenization
                      // @ts-expect-error type mismatch here
                      editorRef.current?.executeMenuItemCommand({
                        itemKey: item.itemKey,
                        ...item.extraProps,
                      });
                    }}
                    handleSubmit={(e) => void handleSubmit(onSubmit)(e)}
                    isCommentEmpty={isEmpty}
                    isSubmitting={isSubmitting}
                    showAccessSpecifier={false}
                    showSubmitButton={false}
                    editorRef={isEditorReady ? editorRef.current : null}
                  />
                }
                editor={
                  <LiteTextEditor
                    editable
                    workspaceId={workspaceId}
                    id={"add_comment_" + entityId}
                    value={"<p></p>"}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    onEnterKeyPress={(e) => {
                      if (!isEmpty && !isSubmitting) {
                        handleSubmit(onSubmit)(e);
                      }
                    }}
                    ref={editorRef}
                    handleEditorReady={setIsEditorReady}
                    initialValue={value ?? "<p></p>"}
                    containerClassName="min-h-min max-h-[200px] overflow-y-auto overscroll-contain"
                    onChange={(comment_json, comment_html) => onChange(comment_html)}
                    isSubmitting={isSubmitting}
                    uploadFile={async (blockId, file) => {
                      const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                      setUploadedAssetIds((prev) => [...prev, asset_id]);
                      return asset_id;
                    }}
                    duplicateFile={async (assetId: string) => {
                      const { asset_id } = await activityOperations.duplicateCommentAsset(assetId);
                      setUploadedAssetIds((prev) => [...prev, asset_id]);
                      return asset_id;
                    }}
                    variant="none"
                    parentClassName="w-full rounded-none border-0 p-0"
                    displayConfig={{
                      fontSize: "small-font",
                    }}
                  />
                }
              />
            )}
          />
        )}
      />
    </div>
  );
});
