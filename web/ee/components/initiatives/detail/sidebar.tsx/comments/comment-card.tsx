"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Check, Globe2, Lock, Pencil, Trash2, X } from "lucide-react";
// PLane
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
import { CustomMenu } from "@plane/ui";
// components
import { LiteTextEditor, LiteTextReadOnlyEditor } from "@/components/editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useUser } from "@/hooks/store";
// Plane-web
import { TInitiativeComment } from "@/plane-web/types/initiative";
//
import { TInitiativeActivityOperations } from "../comments";
import { IssueCommentBlock } from "./comment-block";
import { InitiativeCommentReactions } from "./comment-reaction";

type TInitiativeCommentCard = {
  workspaceSlug: string;
  initiativeId: string;
  comment: TInitiativeComment;
  activityOperations: TInitiativeActivityOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const InitiativeCommentCard: FC<TInitiativeCommentCard> = observer((props) => {
  const {
    workspaceSlug,
    comment,
    initiativeId,
    activityOperations,
    ends,
    showAccessSpecifier = false,
    disabled = false,
  } = props;
  const { data: currentUser } = useUser();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const showEditorRef = useRef<EditorReadOnlyRefApi>(null);
  // state
  const [isEditing, setIsEditing] = useState(false);

  const workspaceId = comment.workspace;

  const {
    formState: { isSubmitting },
    handleSubmit,
    setFocus,
    watch,
    setValue,
  } = useForm<Partial<TInitiativeComment>>({
    defaultValues: { comment_html: comment?.comment_html },
  });

  const onEnter = (formData: Partial<TInitiativeComment>) => {
    if (isSubmitting || !comment) return;
    setIsEditing(false);

    activityOperations.updateComment(comment.id, formData);

    editorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
    showEditorRef.current?.setEditorValue(formData?.comment_html ?? "<p></p>");
  };

  useEffect(() => {
    if (isEditing) {
      setFocus("comment_html");
    }
  }, [isEditing, setFocus]);

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);

  if (!comment || !currentUser) return <></>;
  return (
    <IssueCommentBlock
      comment={comment}
      quickActions={
        <>
          {!disabled && currentUser?.id === comment.actor && (
            <CustomMenu ellipsis closeOnSelect>
              <CustomMenu.MenuItem onClick={() => setIsEditing(true)} className="flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Edit comment
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
                      <Globe2 className="h-3 w-3" />
                      Switch to public comment
                    </CustomMenu.MenuItem>
                  ) : (
                    <CustomMenu.MenuItem
                      onClick={() =>
                        activityOperations.updateComment(comment.id, { access: EIssueCommentAccessSpecifier.INTERNAL })
                      }
                      className="flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      Switch to private comment
                    </CustomMenu.MenuItem>
                  )}
                </>
              )}
              <CustomMenu.MenuItem
                onClick={() => activityOperations.removeComment(comment.id)}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete comment
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
              onChange={(comment_json, comment_html) => setValue("comment_html", comment_html as never)}
              onEnterKeyPress={(e) => {
                if (!isEmpty && !isSubmitting) {
                  handleSubmit(onEnter)(e);
                }
              }}
              showSubmitButton={false}
              uploadFile={async (file) => {
                const { asset_id } = await activityOperations.uploadCommentAsset(file, comment.id);
                return asset_id;
              }}
            />
          </div>
          <div className="flex gap-1 self-end">
            <button
              type="button"
              onClick={handleSubmit(onEnter)}
              disabled={isSubmitting || isEmpty}
              className={`group rounded border border-green-500 bg-green-500/20 p-2 shadow-md duration-300  ${
                isEmpty ? "cursor-not-allowed bg-gray-200" : "hover:bg-green-500"
              }`}
            >
              <Check
                className={`h-3 w-3 text-green-500 duration-300 ${isEmpty ? "text-black" : "group-hover:text-white"}`}
              />
            </button>
            <button
              type="button"
              className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3 w-3 text-red-500 duration-300 group-hover:text-white" />
            </button>
          </div>
        </form>
        <div className={`relative ${isEditing ? "hidden" : ""}`}>
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
            workspaceSlug={workspaceSlug}
          />

          <InitiativeCommentReactions
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            comment={comment}
            disabled={disabled}
          />
        </div>
      </>
    </IssueCommentBlock>
  );
});
