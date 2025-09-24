// react
import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// editor
import type { EditorRefApi } from "@plane/editor";
// types
import { EFileAssetType, type JSONContent, type TPageComment } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { cn, isCommentEmpty, trimEmptyParagraphsFromJson, trimEmptyParagraphsFromHTML } from "@plane/utils";
// editor
import { LiteTextEditor } from "@/components/editor/lite-text";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
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
    placeholder = "Add a comment",
    isSubmitting = false,
    pageId,
    isReply = false,
    onSubmit,
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

  const { uploadEditorAsset } = useEditorAsset();

  const uploadCommentAsset = useCallback(
    async (blockId: string, file: File) => {
      if (!workspaceSlug || !uploadEditorAsset) throw new Error("Missing upload configuration");

      let uploadConfig: Parameters<typeof uploadEditorAsset>[0] = {
        blockId,
        data: {
          entity_identifier: comment?.id ?? "",
          entity_type: EFileAssetType.PAGE_COMMENT_DESCRIPTION,
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
    [uploadEditorAsset, page.project_ids, workspaceSlug, comment?.id]
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

      // Trim empty paragraphs from both JSON and HTML content
      const trimmedJson = formData.description.description_json
        ? trimEmptyParagraphsFromJson(formData.description.description_json)
        : EMPTY_COMMENT_JSON;

      const trimmedHtml = formData.description.description_html
        ? trimEmptyParagraphsFromHTML(formData.description.description_html)
        : "<p></p>";

      onSubmit({
        description: {
          description_html: trimmedHtml,
          description_json: trimmedJson,
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
  // states
  const [isFocused, setIsFocused] = useState(false);

  // For editable mode (both new comments and editing existing)
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty) handleSubmit(onFormSubmit)(e);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative w-full ",
        comment && "px-2 -mx-2",
        isReply || !comment ? "border border-custom-border-200 rounded p-2" : "",
        isFocused && editable ? "border-2 border-custom-primary-100 rounded py-2" : ""
      )}
    >
      <Controller
        name="description"
        control={control}
        render={({ field: { value, onChange } }) => (
          <LiteTextEditor
            showToolbarInitially={false}
            editable={editable}
            workspaceId={workspaceId}
            autofocus
            id={
              comment ? `edit_comment_${comment.id}` : (isReply ? "reply_comment_" : "add_comment_") + (pageId || "new")
            }
            workspaceSlug={workspaceSlug}
            onEnterKeyPress={(e) => handleSubmit(onFormSubmit)(e)}
            value={null}
            uploadFile={async (blockId, file) => {
              const { asset_id } = await uploadCommentAsset(blockId, file);
              setUploadedAssetIds((prev) => [...prev, asset_id]);
              return asset_id;
            }}
            ref={editorRef}
            initialValue={value?.description_json ?? EMPTY_COMMENT_JSON}
            containerClassName="min-h-min !p-0"
            onChange={(description_json, description_html) => {
              onChange({ description_json, description_html });
            }}
            isSubmitting={isSubmittingState}
            showSubmitButton={!comment}
            variant="lite"
            placeholder={placeholder}
            parentClassName="!border-none !p-0"
            displayConfig={{ fontSize: "small-font" }}
          />
        )}
      />
    </div>
  );
});
