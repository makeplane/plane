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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useLocalStorage } from "@plane/hooks";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
import { isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";

type TCommentCreate = {
  entityId: string;
  workspaceSlug: string;
  activityOperations: TCommentsOperations;
  showToolbarInitially?: boolean;
  projectId?: string;
  onSubmitCallback?: (elementId: string) => void;
};

// services
const fileService = new FileService();

export const CommentCreate = observer(function CommentCreate(props: TCommentCreate) {
  const {
    workspaceSlug,
    entityId,
    activityOperations,
    showToolbarInitially = false,
    projectId,
    onSubmitCallback,
  } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;
  // form info
  const {
    getValues,
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    watch,
  } = useForm<Partial<TIssueComment>>();
  // local storage
  const commentId = "add_comment_" + entityId;
  const { storedValue: storedCommentDescription, setValue: setStoredCommentDescription } = useLocalStorage<
    string | undefined
  >(commentId, undefined);
  // derived form values
  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML);

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
      setStoredCommentDescription(undefined);
    } catch (error) {
      console.error(error);
    } finally {
      reset({
        comment_html: "",
      });
      editorRef.current?.clearEditor();
    }
  };

  // auto save comment description to local storage on unmount and page reload/close
  useEffect(() => {
    const saveCommentToLocalStorage = () => {
      const latestDescription = getValues("comment_html");
      const isLatestDescriptionEmpty = isCommentEmpty(latestDescription);
      if (latestDescription && !isLatestDescriptionEmpty) {
        setStoredCommentDescription(latestDescription);
      }
    };

    window.addEventListener("beforeunload", saveCommentToLocalStorage);
    return () => {
      saveCommentToLocalStorage();
      window.removeEventListener("beforeunload", saveCommentToLocalStorage);
    };
    // react-hook-form methods should not be included in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setStoredCommentDescription]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="sticky sm:static bottom-0 z-4 bg-surface-1"
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
          void handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { onChange } }) => (
              <LiteTextEditor
                editable
                workspaceId={workspaceId}
                id={commentId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    void handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                initialValue={storedCommentDescription || "<p></p>"}
                containerClassName="min-h-min"
                onChange={(_comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
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
                showToolbarInitially={showToolbarInitially}
                parentClassName="p-2"
                displayConfig={{
                  fontSize: "small-font",
                }}
              />
            )}
          />
        )}
      />
    </div>
  );
});
