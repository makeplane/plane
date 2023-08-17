import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// services
import issuesServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { SecondaryButton } from "components/ui";
// types
import type { ICurrentUserResponse, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
import Tiptap, { ITiptapRichTextEditor } from "components/tiptap";

const TiptapEditor = React.forwardRef<ITiptapRichTextEditor, ITiptapRichTextEditor>(
  (props, ref) => <Tiptap {...props} forwardedRef={ref} />
);

TiptapEditor.displayName = "TiptapEditor";

const defaultValues: Partial<IIssueComment> = {
  comment_json: "",
  comment_html: "",
};

type Props = {
  issueId: string;
  user: ICurrentUserResponse | undefined;
  disabled?: boolean;
};

export const AddComment: React.FC<Props> = ({ issueId, user, disabled = false }) => {
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const onSubmit = async (formData: IIssueComment) => {
    if (
      !workspaceSlug ||
      !projectId ||
      !issueId ||
      isSubmitting ||
      !formData.comment_html ||
      !formData.comment_json
    )
      return;
    await issuesServices
      .createIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        formData,
        user
      )
      .then(() => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="issue-comments-section">
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TiptapEditor
                ref={editorRef}
                value={
                  !value ||
                  value === "" ||
                  (typeof value === "object" && Object.keys(value).length === 0)
                    ? watch("comment_html")
                    : value
                }
                customClassName="p-3 min-h-[50px]"
                debouncedUpdatesEnabled={false}
                onChange={(comment_json: Object, comment_html: string) => {
                  onChange(comment_html);
                  setValue("comment_json", comment_json);
                }}
              />
            )}
          />

          <SecondaryButton type="submit" disabled={isSubmitting || disabled} className="mt-2">
            {isSubmitting ? "Adding..." : "Comment"}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
};
