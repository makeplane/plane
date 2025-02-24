"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Check, Globe2, Lock, Pencil, Trash2, X } from "lucide-react";
// plane constants
import { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane types
import { TIssueComment } from "@plane/types";
// plane ui
import { CustomMenu } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// components
import { LiteTextEditor, LiteTextReadOnlyEditor } from "@/components/editor";
// helpers
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useIssueDetail, useUser, useWorkspace } from "@/hooks/store";
// components
import { IssueCommentReaction } from "../../reactions/issue-comment";
import { TActivityOperations } from "../root";
import { IssueCommentBlock } from "./comment-block";

type TIssueCommentCard = {
  projectId: string;
  issueId: string;
  workspaceSlug: string;
  commentId: string;
  activityOperations: TActivityOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const IssueCommentCard: FC<TIssueCommentCard> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    commentId,
    activityOperations,
    ends,
    showAccessSpecifier = false,
    disabled = false,
  } = props;
  const { t } = useTranslation();
  // states
  const [isEditing, setIsEditing] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const showEditorRef = useRef<EditorReadOnlyRefApi>(null);
  // store hooks
  const {
    comment: { getCommentById },
  } = useIssueDetail();
  const { data: currentUser } = useUser();
  // derived values
  const comment = getCommentById(commentId);
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(comment?.workspace_detail?.slug as string)?.id as string;
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
  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML);
  const isEditorReadyToDiscard = editorRef.current?.isEditorReadyToDiscard();
  const isSubmitButtonDisabled = isSubmitting || !isEditorReadyToDiscard;

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

  if (!comment || !currentUser) return <></>;

  return (
    <IssueCommentBlock
      commentId={commentId}
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
              projectId={projectId}
              issue_id={issueId}
              workspaceSlug={workspaceSlug}
              ref={editorRef}
              id={comment.id}
              initialValue={commentHTML ?? ""}
              value={null}
              onChange={(comment_json, comment_html) => setValue("comment_html", comment_html)}
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
            />
          </div>
          <div className="flex gap-1 self-end">
            {!isEmpty && (
              <button
                type="button"
                onClick={handleSubmit(onEnter)}
                disabled={isSubmitButtonDisabled}
                className={cn(
                  "group rounded border border-green-500 text-green-500 hover:text-white bg-green-500/20 hover:bg-green-500 p-2 shadow-md duration-300",
                  {
                    "pointer-events-none": isSubmitButtonDisabled,
                  }
                )}
              >
                <Check className="size-3" />
              </button>
            )}
            <button
              type="button"
              className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
              onClick={() => setIsEditing(false)}
            >
              <X className="size-3 text-red-500 duration-300 group-hover:text-white" />
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
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />

          <IssueCommentReaction
            workspaceSlug={workspaceSlug}
            projectId={comment?.project_detail?.id}
            commentId={comment.id}
            currentUser={currentUser}
            disabled={disabled}
          />
        </div>
      </>
    </IssueCommentBlock>
  );
});
