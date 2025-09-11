// react
import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Check, X } from "lucide-react";
// editor
import type { EditorRefApi } from "@plane/editor";
// types
import { EFileAssetType, type JSONContent, type TPageComment } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { cn, isCommentEmpty } from "@plane/utils";
// editor
import { LiteTextEditor } from "@/components/editor/lite-text";
// types
import { type TPageInstance } from "@/store/pages/base-page";

type CommentBoxProps = {
  // Required props
  workspaceSlug: string;
  workspaceId: string;
  page: TPageInstance;

  // Comment data
  comment?: TPageComment;
  editable?: boolean;

  // Form props
  placeholder?: string;
  autoFocus?: boolean;
  isSubmitting?: boolean;

  // Comment creation props (when no comment provided)
  pageId?: string;
  isReply?: boolean;
  commentSelection?: {
    from: number;
    to: number;
    referenceText?: string;
  } | null;

  // Action callbacks
  onSubmit: (data: {
    description: { description_html: string; description_json: JSONContent };
    uploadedAssetIds: string[];
  }) => void;
  onCancel?: () => void;
  uploadEditorAsset?: (args: {
    blockId: string;
    data: { entity_identifier: string; entity_type: EFileAssetType };
    projectId?: string;
    file: File;
    workspaceSlug: string;
  }) => Promise<{ asset_id: string }>;
};

export const EMPTY_COMMENT_JSON: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export const PageCommentForm = observer((props: CommentBoxProps) => {
  const {
    workspaceSlug,
    page,
    workspaceId,
    comment,
    editable = false,
    placeholder = "Add a comment...",
    isSubmitting = false,
    pageId,
    isReply = false,
    onSubmit,
    onCancel,
    uploadEditorAsset,
  } = props;

  const editorRef = useRef<EditorRefApi>(null);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const [originalContent, setOriginalContent] = useState<{
    description_html: string;
    description_json: JSONContent;
  } | null>(null);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isSubmitting: formIsSubmitting },
  } = useForm<Partial<TPageComment>>({
    defaultValues: {
      description: comment?.description,
    },
  });

  // Store original content when component mounts with existing comment
  useEffect(() => {
    if (comment?.description && editable) {
      setOriginalContent({
        description_html: comment.description.description_html,
        description_json: comment.description.description_json,
      });
    }
  }, [comment?.description, editable]);

  const isSubmittingState = isSubmitting || internalIsSubmitting || formIsSubmitting;

  const watchedDescription = watch("description");
  const isEmpty = isCommentEmpty(watchedDescription?.description_html);
  const isEditorReadyToDiscard = editorRef.current?.isEditorReadyToDiscard();
  const isSubmitButtonDisabled = isSubmittingState || !isEditorReadyToDiscard;
  const isDisabled = isSubmittingState || isEmpty || isSubmitButtonDisabled;

  const uploadCommentAsset = useCallback(
    async (blockId: string, file: File, entityIdentifier: string) => {
      if (!workspaceSlug || !uploadEditorAsset) throw new Error("Missing upload configuration");

      let uploadConfig: Parameters<typeof uploadEditorAsset>[0] = {
        blockId,
        data: {
          entity_identifier: entityIdentifier,
          entity_type: EFileAssetType.COMMENT_DESCRIPTION,
        },
        file,
        workspaceSlug,
      };

      // if it's a project page, use the project id
      if (page.project_ids?.length && page.project_ids?.length > 0) {
        uploadConfig = {
          ...uploadConfig,
          projectId: page.project_ids?.[0] || "",
        };
      }
      const res = await uploadEditorAsset(uploadConfig);
      setUploadedAssetIds((prev) => [...prev, res.asset_id]);
      return res;
    },
    [uploadEditorAsset, page.project_ids, workspaceSlug]
  );

  const onFormSubmit = async (formData: Partial<TPageComment>) => {
    if (!formData.description || isEmpty || isSubmittingState) return;

    // Store current content before submission for potential rollback
    const currentContent = {
      description_html: formData.description.description_html,
      description_json: formData.description.description_json,
    };

    try {
      setInternalIsSubmitting(true);

      onSubmit({
        description: {
          description_html: formData.description.description_html || "<p></p>",
          description_json: formData.description.description_json || EMPTY_COMMENT_JSON,
        },
        uploadedAssetIds,
      });

      // Success - update original content to current content
      setOriginalContent(currentContent);

      // Only show success toast for new comments - existing comments are handled by parent
    } catch (error) {
      console.error("Failed to submit comment:", error);

      // Rollback to original content if editing existing comment
      if (comment && originalContent) {
        editorRef.current?.setEditorValue(originalContent.description_html);
        reset({
          description: originalContent,
        });
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: comment
          ? "Comment could not be updated. Please try again."
          : "Comment could not be created. Please try again.",
      });
    } finally {
      setUploadedAssetIds([]);
      setInternalIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    try {
      // Reset form to original values
      if (comment?.description) {
        const resetContent = originalContent || {
          description_html: comment.description.description_html,
          description_json: comment.description.description_json,
        };

        // Reset editor content
        editorRef.current?.setEditorValue(resetContent.description_html);

        // Reset form state
        reset({
          description: resetContent,
        });
      }

      // Clear uploaded assets
      setUploadedAssetIds([]);

      // Call parent cancel handler
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error("Failed to cancel comment editing:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to cancel editing. Please refresh the page.",
      });
    }
  };

  // For editable mode (both new comments and editing existing)
  return (
    <div className="relative w-full">
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty) handleSubmit(onFormSubmit)(e);
        }}
        className={cn(isReply || !comment ? "border border-custom-border-200 rounded p-2" : "")}
      >
        <Controller
          name="description"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LiteTextEditor
              editable={editable}
              workspaceId={workspaceId}
              autofocus
              id={
                comment
                  ? `edit_comment_${comment.id}`
                  : (isReply ? "reply_comment_" : "add_comment_") + (pageId || "new")
              }
              workspaceSlug={workspaceSlug}
              onEnterKeyPress={(e) => handleSubmit(onFormSubmit)(e)}
              value={null}
              uploadFile={
                uploadEditorAsset
                  ? async (blockId, file) => {
                      const { asset_id } = await uploadCommentAsset(blockId, file, comment?.id || pageId || "new");
                      return asset_id;
                    }
                  : async () => ""
              }
              ref={editorRef}
              initialValue={value?.description_json ?? EMPTY_COMMENT_JSON}
              containerClassName="min-h-min !p-0"
              onChange={(description_json, description_html) => {
                onChange({ description_json, description_html });
              }}
              isSubmitting={isSubmittingState}
              showSubmitButton={!comment}
              showToolbarInitially
              placeholder={placeholder}
              parentClassName="!border-none !p-0"
              // editorClassName="!text-base"
              displayConfig={{ fontSize: "small-font" }}
            />
          )}
        />
      </div>

      {/* Custom submit buttons - only show when editing existing comments */}
      {comment && editable && (
        <div className="flex justify-end gap-1 mt-2 pb-1">
          {!isEmpty && (
            <button
              type="button"
              onClick={handleSubmit(onFormSubmit)}
              disabled={isDisabled}
              className={cn(
                "group rounded border border-green-500 bg-green-500/20 p-2 shadow-md duration-300",
                isEmpty ? "cursor-not-allowed bg-gray-200" : "hover:bg-green-500"
              )}
            >
              <Check
                className={cn(
                  "size-2.5 text-green-500 duration-300",
                  isEmpty ? "text-black" : "group-hover:text-white"
                )}
              />
            </button>
          )}
          <button
            type="button"
            className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
            onClick={handleCancel}
          >
            <X className="size-3 text-red-500 duration-300 group-hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
});
