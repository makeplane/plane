import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
// components
import { EditorRefApi } from "@plane/lite-text-editor";
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
// hooks
import useToast from "@/hooks/use-toast";
// lib
import { useMobxStore } from "@/lib/mobx/store-provider";
// types
import { Comment } from "@/types/issue";

const defaultValues: Partial<Comment> = {
  comment_html: "",
};

type Props = {
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = observer(() => {
  // const { disabled = false } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useRouter();
  const { workspace_slug, project_slug } = router.query;
  // store hooks
  const { project } = useMobxStore();
  const { user: userStore, issueDetails: issueDetailStore } = useMobxStore();
  // derived values
  const workspaceId = project.workspace?.id;
  const issueId = issueDetailStore.peekId;
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });
  // toast alert
  const { setToastAlert } = useToast();

  const onSubmit = async (formData: Comment) => {
    if (!workspace_slug || !project_slug || !issueId || isSubmitting || !formData.comment_html) return;

    await issueDetailStore
      .addIssueComment(workspace_slug.toString(), project_slug.toString(), issueId, formData)
      .then(() => {
        reset(defaultValues);
        editorRef.current?.clearEditor();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        })
      );
  };

  return (
    <div>
      <div className="issue-comments-section">
        <Controller
          name="comment_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LiteTextEditor
              onEnterKeyPress={(e) => userStore.requiredLogin(() => handleSubmit(onSubmit)(e))}
              workspaceId={workspaceId as string}
              workspaceSlug={workspace_slug as string}
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
