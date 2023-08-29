import React from "react";
import { useRouter } from "next/router";
// react-hook-form
import { useForm, Controller } from "react-hook-form";
// components
import { SecondaryButton } from "components/ui";
import { TipTapEditor } from "components/tiptap";
// types
import type { IIssueComment } from "types";

const defaultValues: Partial<IIssueComment> = {
  comment_json: "",
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  onSubmit: (data: IIssueComment) => Promise<void>;
};

export const AddComment: React.FC<Props> = ({ disabled = false, onSubmit }) => {
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<IIssueComment>({ defaultValues });

  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleAddComment = async (formData: IIssueComment) => {
    if (!formData.comment_html || !formData.comment_json || isSubmitting) return;

    await onSubmit(formData).then(() => {
      reset(defaultValues);
      editorRef.current?.clearEditor();
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(handleAddComment)}>
        <div className="issue-comments-section">
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TipTapEditor
                workspaceSlug={workspaceSlug as string}
                ref={editorRef}
                value={
                  !value ||
                  value === "" ||
                  (typeof value === "object" && Object.keys(value).length === 0)
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

          <SecondaryButton type="submit" disabled={isSubmitting || disabled} className="mt-2">
            {isSubmitting ? "Adding..." : "Comment"}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
};
