import React, { useRef } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useForm, Controller } from "react-hook-form";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// ui
import { SecondaryButton } from "components/ui";
// types
import { Comment } from "types/issue";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// service
import fileService from "services/file.service";

const defaultValues: Partial<Comment> = {
  comment_html: "",
};

type Props = {
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = observer((props) => {
  const { disabled = false } = props;

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });

  const router = useRouter();
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
            <LiteTextEditorWithRef
              onEnterKeyPress={(e) => {
                userStore.requiredLogin(() => {
                  handleSubmit(onSubmit)(e);
                });
              }}
              uploadFile={fileService.getUploadFileFunction(workspace_slug as string)}
              deleteFile={fileService.deleteImage}
              ref={editorRef}
              value={
                !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                  ? watch("comment_html")
                  : value
              }
              customClassName="p-3 min-h-[50px] shadow-sm"
              debouncedUpdatesEnabled={false}
              onChange={(comment_json: Object, comment_html: string) => {
                onChange(comment_html);
              }}
            />
          )}
        />

        <SecondaryButton
          onClick={(e) => {
            userStore.requiredLogin(() => {
              handleSubmit(onSubmit)(e);
            });
          }}
          type="submit"
          disabled={isSubmitting || disabled}
          className="mt-2"
        >
          {isSubmitting ? "Adding..." : "Comment"}
        </SecondaryButton>
      </div>
    </div>
  );
});
