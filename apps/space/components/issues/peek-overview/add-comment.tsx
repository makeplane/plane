import React, { useRef } from "react";

import { useParams } from "next/navigation";

import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// react-hook-form
import { useForm, Controller } from "react-hook-form";

// hooks
import useToast from "hooks/use-toast";

// ui
import { SecondaryButton } from "components/ui";

// types
import { Comment } from "store/types";

// components
import Tiptap, { ITiptapRichTextEditor } from "components/tiptap";

const TiptapEditor = React.forwardRef<ITiptapRichTextEditor, ITiptapRichTextEditor>((props, ref) => (
  <Tiptap {...props} forwardedRef={ref} />
));

TiptapEditor.displayName = "TiptapEditor";

const defaultValues: Partial<Comment> = {
  comment_json: "",
  comment_html: "",
};

type Props = {
  issueId: string | null;
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = observer((props) => {
  const { issueId, disabled = false } = props;

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Comment>({ defaultValues });

  const routerParams = useParams();
  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };

  const { issue: issueStore, user: userStore } = useMobxStore();

  const editorRef = useRef<any>(null);

  const { setToastAlert } = useToast();

  const onSubmit = async (formData: Comment) => {
    if (
      !workspace_slug ||
      !project_slug ||
      !issueId ||
      isSubmitting ||
      !formData.comment_html ||
      !formData.comment_json
    )
      return;

    await issueStore
      .createIssueCommentAsync(workspace_slug, project_slug, issueId, formData)
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
            <TiptapEditor
              workspaceSlug={workspace_slug as string}
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
                setValue("comment_json", comment_json);
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
