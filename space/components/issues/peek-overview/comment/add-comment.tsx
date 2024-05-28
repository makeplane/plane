import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { useForm, Controller } from "react-hook-form";
// editor
import { EditorRefApi } from "@plane/lite-text-editor";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// editor components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
// hooks
import { useIssueDetails, useProject, useUser } from "@/hooks/store";
// types
import { Comment } from "@/types/issue";

const defaultValues: Partial<Comment> = {
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  workspaceSlug: string;
  projectId: string;
};

export const AddComment: React.FC<Props> = observer((props) => {
  // const { disabled = false } = props;
  const { workspaceSlug, projectId } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { workspace } = useProject();
  const { peekId: issueId, addIssueComment } = useIssueDetails();
  const { data: currentUser } = useUser();
  // derived values
  const workspaceId = workspace?.id;
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });

  const onSubmit = async (formData: Comment) => {
    if (!workspaceSlug || !projectId || !issueId || isSubmitting || !formData.comment_html) return;

    await addIssueComment(workspaceSlug, projectId, issueId, formData)
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
              onEnterKeyPress={(e) => {
                if (currentUser) handleSubmit(onSubmit)(e);
              }}
              workspaceId={workspaceId as string}
              workspaceSlug={workspaceSlug}
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
