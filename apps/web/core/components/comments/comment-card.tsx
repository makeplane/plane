"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Check, Globe2, Lock, Pencil, Trash2, X } from "lucide-react";
// PLane
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import type { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TIssueComment, TCommentsOperations } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// components
import { isCommentEmpty } from "@plane/utils";
import { LiteTextEditor, LiteTextReadOnlyEditor } from "@/components/editor";
// helpers
// hooks
import { useUser } from "@/hooks/store";
//
import { CommentBlock } from "@/plane-web/components/comments";
import { CommentReactions } from "./comment-reaction";

type TCommentCard = {
  workspaceSlug: string;
  comment: TIssueComment | undefined;
  activityOperations: TCommentsOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
  projectId?: string;
};

export const CommentCard: FC<TCommentCard> = observer((props) => {
  const {
    workspaceSlug,
    comment,
    activityOperations,
    ends,
    showAccessSpecifier = false,
    disabled = false,
    projectId,
  } = props;
  const { t } = useTranslation();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const showEditorRef = useRef<EditorReadOnlyRefApi>(null);
  // state
  const [isEditing, setIsEditing] = useState(false);
  // store hooks
  const { data: currentUser } = useUser();
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
  // derived values
  const workspaceId = comment?.workspace;
  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);
  const isEditorReadyToDiscard = editorRef.current?.isEditorReadyToDiscard();
  const isSubmitButtonDisabled = isSubmitting || !isEditorReadyToDiscard;
  const isDisabled = isSubmitting || isEmpty || isSubmitButtonDisabled;

  // helpers
  const onEnter = async (formData: Partial<TIssueComment>) => {
    if (isSubmitting || !comment) return;

    setIsEditing(false);

    await activityOperations.updateComment(comment.id, formData);

    editorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
    showEditorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
  };

  useEffect(() => {
    if (isEditing) {
      setFocus("comment_html");
    }
  }, [isEditing, setFocus]);

  if (!comment || !currentUser || !workspaceId) return <></>;

  return (
    <CommentBlock
      comment={comment}
      quickActions={
        <>
          {!disabled && currentUser?.id === comment.actor && (
            <CustomMenu ellipsis closeOnSelect>
              <CustomMenu.MenuItem onClick={() => setIsEditing(true)} className="flex items-center gap-1">
                <Pencil className="flex-shrink-0 size-3" />
                {t("common.actions.edit")}
              </CustomMenu.MenuItem>
              {showAccessSpecifier && (
                <>
                  {comment.access === "INTERNAL" ? (
                    <CustomMenu.MenuItem
                      onClick={() =>
                        activityOperations.updateComment(comment.id, { access: EIssueCommentAccessSpecifier.EXTERNAL })
                      }
                      className="flex items-center gap-1"
                    >
                      <Globe2 className="flex-shrink-0 size-3" />
                      {t("issue.comments.switch.public")}
                    </CustomMenu.MenuItem>
                  ) : (
                    <CustomMenu.MenuItem
                      onClick={() =>
                        activityOperations.updateComment(comment.id, { access: EIssueCommentAccessSpecifier.INTERNAL })
                      }
                      className="flex items-center gap-1"
                    >
                      <Lock className="flex-shrink-0 size-3" />
                      {t("issue.comments.switch.private")}
                    </CustomMenu.MenuItem>
                  )}
                </>
              )}
              <CustomMenu.MenuItem
                onClick={() => activityOperations.removeComment(comment.id)}
                className="flex items-center gap-1"
              >
                <Trash2 className="flex-shrink-0 size-3" />
                {t("common.actions.delete")}
              </CustomMenu.MenuItem>
            </CustomMenu>
          )}
        </>
      }
      ends={ends}
    >
      <>
        <form className={`flex-col gap-2 ${isEditing ? "flex" : "hidden"}`}>
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty) handleSubmit(onEnter)(e);
            }}
          >
            <LiteTextEditor
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              ref={editorRef}
              id={comment.id}
              initialValue={commentHTML ?? ""}
              value={null}
              onChange={(comment_json, comment_html) => setValue("comment_html", comment_html)}
              onEnterKeyPress={() => {
                if (!isEmpty && !isSubmitting) {
                  handleSubmit(onEnter)();
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
        <div className={`relative flex flex-col gap-2 ${isEditing ? "hidden" : ""}`}>
          {showAccessSpecifier && (
            <div className="absolute right-2.5 top-2.5 z-[1] text-custom-text-300">
              {comment.access === EIssueCommentAccessSpecifier.INTERNAL ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Globe2 className="h-3 w-3" />
              )}
            </div>
          )}
          <LiteTextReadOnlyEditor
            ref={showEditorRef}
            id={comment.id}
            initialValue={comment.comment_html ?? ""}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            containerClassName="!py-1"
            projectId={(projectId as string) ?? ""}
            displayConfig={{
              fontSize: "small-font",
            }}
          />
          <CommentReactions comment={comment} disabled={disabled} activityOperations={activityOperations} />
        </div>
      </>
    </CommentBlock>
  );
});
