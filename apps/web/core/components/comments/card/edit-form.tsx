import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Check, X } from "lucide-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { isCommentEmpty } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor";

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

export const CommentCardEditForm: React.FC<Props> = observer((props) => {
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

  const isEmpty = isCommentEmpty(commentHTML ?? undefined);
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
          projectId={projectId?.toString() ?? ""}
          parentClassName="p-2"
          displayConfig={{
            fontSize: "small-font",
          }}
        />
      </div>
      <div className="flex gap-1 self-end">
        {!isEmpty && (
          <button
            type="button"
            onClick={handleSubmit(onEnter)}
            disabled={isDisabled}
            className={`group rounded border border-green-500 bg-green-500/20 p-2 shadow-md duration-300  ${
              isEmpty ? "cursor-not-allowed bg-gray-200" : "hover:bg-green-500"
            }`}
          >
            <Check
              className={`h-3 w-3 text-green-500 duration-300 ${isEmpty ? "text-black" : "group-hover:text-white"}`}
            />
          </button>
        )}
        <button
          type="button"
          className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
          onClick={() => {
            setIsEditing(false);
            editorRef.current?.setEditorValue(comment.comment_html ?? "<p></p>");
          }}
        >
          <X className="size-3 text-red-500 duration-300 group-hover:text-white" />
        </button>
      </div>
    </form>
  );
});
