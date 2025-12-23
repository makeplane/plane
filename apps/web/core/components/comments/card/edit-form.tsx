import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Check } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { cn, isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";

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
  // refs
  const editorRef = useRef<EditorRefApi>(null);
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
  const isSubmitButtonDisabled = isSubmitting || !isEditorReadyToDiscard;
  const isDisabled = isSubmitting || isEmpty || isSubmitButtonDisabled;

  const onEnter = async (formData: Partial<TIssueComment>) => {
    if (isSubmitting || !comment) return;

    setIsEditing(false);

    await activityOperations.updateComment(comment.id, formData);

    editorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
    readOnlyEditorRef?.setEditorValue(formData?.comment_html ?? "<p></p>");
  };

  useEffect(() => {
    if (isEditing) {
      setFocus("comment_html");
    }
  }, [isEditing, setFocus]);

  return (
    <form className="flex flex-col gap-2">
      <div
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
          parentClassName="p-2 bg-surface-1"
          displayConfig={{
            fontSize: "small-font",
          }}
        />
      </div>
      <div className="flex gap-2 self-end">
        {!isEmpty && (
          <button
            type="button"
            onClick={handleSubmit(onEnter)}
            disabled={isDisabled}
            className={cn(
              "group rounded-lg border size-7 flex items-center justify-center shadow-md duration-300",
              isDisabled
                ? "cursor-not-allowed border-green-500/50 bg-green-500/10"
                : "border-green-500 bg-green-500/20 hover:bg-green-500"
            )}
          >
            <Check
              className={cn(
                "size-4 duration-300",
                isDisabled ? "text-green-500/50" : "text-green-500 group-hover:text-on-color"
              )}
            />
          </button>
        )}
        <button
          type="button"
          disabled={isSubmitting}
          className={cn(
            "group rounded-lg border size-7 flex items-center justify-center shadow-md duration-300",
            isSubmitting
              ? "cursor-not-allowed border-red-500/50 bg-red-500/10"
              : "border-red-500 bg-red-500/20 hover:bg-red-500"
          )}
          onClick={() => {
            setIsEditing(false);
            editorRef.current?.setEditorValue(comment.comment_html ?? "<p></p>");
          }}
        >
          <CloseIcon
            className={cn(
              "size-5 duration-300",
              isSubmitting ? "text-red-500/50" : "text-red-500 group-hover:text-on-color"
            )}
          />
        </button>
      </div>
    </form>
  );
});
