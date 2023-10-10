import React from "react";
import { useRouter } from "next/router";
// react-hook-form
import { useForm, Controller } from "react-hook-form";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// ui
import { SecondaryButton } from "components/ui";
// types
import type { IIssueComment } from "types";
// services
import fileService from "services/file.service";

const defaultValues: Partial<IIssueComment> = {
  access: "INTERNAL",
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  onSubmit: (data: IIssueComment) => Promise<void>;
  showAccessSpecifier?: boolean;
};

type commentAccessType = {
  icon: string;
  key: string;
  label: "Private" | "Public";
}
const commentAccess: commentAccessType[] = [
  {
    icon: "lock",
    key: "INTERNAL",
    label: "Private",
  },
  {
    icon: "public",
    key: "EXTERNAL",
    label: "Public",
  },
];

export const AddComment: React.FC<Props> = ({
  disabled = false,
  onSubmit,
  showAccessSpecifier = false,
}) => {
  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const handleAddComment = async (formData: IIssueComment) => {
    if (!formData.comment_html || isSubmitting) return;

    await onSubmit(formData).then(() => {
      reset(defaultValues);
      editorRef.current?.clearEditor();
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(handleAddComment)}>
        <div>
          <div className="relative">
            <Controller
              name="access"
              control={control}
              render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
                <Controller
                  name="comment_html"
                  control={control}
                  render={({ field: { onChange: onCommentChange, value: commentValue } }) => (
                    <LiteTextEditorWithRef
                      onEnterKeyPress={handleSubmit(handleAddComment)}
                      uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                      deleteFile={fileService.deleteImage}
                      ref={editorRef}
                      value={!commentValue || commentValue === "" ? "<p></p>" : commentValue}
                      customClassName="p-3 min-h-[100px] shadow-sm"
                      debouncedUpdatesEnabled={false}
                      onChange={(comment_json: Object, comment_html: string) => onCommentChange(comment_html)}
                      commentAccessSpecifier={{ accessValue, onAccessChange, showAccessSpecifier, commentAccess }}
                    />
                  )}
                />
              )}
            />
          </div>

          <SecondaryButton type="submit" disabled={isSubmitting || disabled} className="mt-2">
            {isSubmitting ? "Adding..." : "Comment"}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
};
