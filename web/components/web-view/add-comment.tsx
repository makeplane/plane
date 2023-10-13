import React from "react";

// next
import { useRouter } from "next/router";

// react-hook-form
import { useForm, Controller } from "react-hook-form";

// hooks
import useProjectDetails from "hooks/use-project-details";

// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// icons
import { Send } from "lucide-react";

// ui
import { PrimaryButton } from "components/ui";

// types
import type { IIssueComment } from "types";
import fileService from "services/file.service";

const defaultValues: Partial<IIssueComment> = {
  access: "INTERNAL",
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  onSubmit: (data: IIssueComment) => Promise<void>;
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

export const AddComment: React.FC<Props> = ({ disabled = false, onSubmit }) => {
  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projectDetails } = useProjectDetails();

  const showAccessSpecifier = projectDetails?.is_deployed || false;

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
    <form className="w-full flex gap-x-2" onSubmit={handleSubmit(handleAddComment)}>
      <div className="relative flex-grow">
        <Controller
          name="access"
          control={control}
          render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
            <Controller
              name="comment_html"
              control={control}
              render={({ field: { onChange: onCommentChange, value: commentValue } }) => (
                <LiteTextEditorWithRef
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

      <div className="inline">
        <PrimaryButton
          type="submit"
          disabled={isSubmitting || disabled}
          className="mt-2 w-10 h-10 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </form>
  );
};
