"use client";

import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// editor
import { EditorRefApi } from "@plane/editor";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// editor components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
// hooks
import { useIssueDetails, usePublish, useUser } from "@/hooks/store";
// types
import { Comment } from "@/types/issue";

const defaultValues: Partial<Comment> = {
  comment_html: "",
};

type Props = {
  anchor: string;
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = observer((props) => {
  const { anchor } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { peekId: issueId, addIssueComment } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { workspaceSlug, workspace: workspaceID } = usePublish(anchor);
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });

  const onSubmit = async (formData: Comment) => {
    if (!anchor || !issueId || isSubmitting || !formData.comment_html) return;

    await addIssueComment(anchor, issueId, formData)
      .then(() => {
        reset(defaultValues);
        editorRef.current?.clearEditor();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        })
      );
  };

  // TODO: on click if he user is not logged in redirect to login page
  return (
    <div>
      <div className="issue-comments-section">
        <Controller
          name="comment_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LiteTextEditor
              onEnterKeyPress={() => {
                if (currentUser) handleSubmit(onSubmit)();
              }}
              workspaceId={workspaceID?.toString() ?? ""}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              ref={editorRef}
              initialValue={
                !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                  ? watch("comment_html")
                  : value
              }
              onChange={(comment_json, comment_html) => onChange(comment_html)}
              isSubmitting={isSubmitting}
            />
          )}
        />
      </div>
    </div>
  );
});
