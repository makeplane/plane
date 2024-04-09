import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
// lib
import { useMobxStore } from "@/lib/mobx/store-provider";
// hooks
import { RootStore } from "@/store/root";
import useToast from "hooks/use-toast";
// ui
// types
import { Comment } from "types/issue";
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
// components
// service

const defaultValues: Partial<Comment> = {
  comment_html: "",
};

type Props = {
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = observer(() => {
  // const { disabled = false } = props;

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });

  const router = useRouter();
  const { project }: RootStore = useMobxStore();
  const workspaceId = project.workspace?.id;

  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const { user: userStore, issueDetails: issueDetailStore } = useMobxStore();

  const issueId = issueDetailStore.peekId;

  const editorRef = useRef<any>(null);

  const { setToastAlert } = useToast();

  const onSubmit = async (formData: Comment) => {
    if (!workspace_slug || !project_slug || !issueId || isSubmitting || !formData.comment_html) return;

    await issueDetailStore
      .addIssueComment(workspace_slug, project_slug, issueId, formData)
      .then(() => {
        reset(defaultValues);
        editorRef.current?.clearEditor();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        });
      });
  };

  return (
    <div>
      <div className="issue-comments-section">
        <Controller
          name="comment_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LiteTextEditor
              onEnterKeyPress={(e) => {
                userStore.requiredLogin(() => {
                  handleSubmit(onSubmit)(e);
                });
              }}
              workspaceId={workspaceId as string}
              workspaceSlug={workspace_slug as string}
              ref={editorRef}
              initialValue={
                !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                  ? watch("comment_html")
                  : value
              }
              customClassName="p-2 border border-custom-border-200"
              editorContentCustomClassNames="min-h-[35px]"
              onChange={(comment_json: unknown, comment_html: string) => {
                onChange(comment_html);
              }}
            />
          )}
        />
      </div>
    </div>
  );
});
