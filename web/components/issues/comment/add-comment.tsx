import React from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";

// services
import { FileService } from "services/file.service";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// ui
import { Button } from "@plane/ui";
import { Globe2, Lock } from "lucide-react";

// types
import type { IIssueComment } from "types";
import useEditorSuggestions from "hooks/use-editor-suggestions";

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
  icon: any;
  key: string;
  label: "Private" | "Public";
};
const commentAccess: commentAccessType[] = [
  {
    icon: Lock,
    key: "INTERNAL",
    label: "Private",
  },
  {
    icon: Globe2,
    key: "EXTERNAL",
    label: "Public",
  },
];

// services
const fileService = new FileService();

export const AddComment: React.FC<Props> = ({ disabled = false, onSubmit, showAccessSpecifier = false }) => {
  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const editorSuggestions = useEditorSuggestions(workspaceSlug as string | undefined, projectId as string | undefined)

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
                      mentionSuggestions={editorSuggestions.mentionSuggestions}
                      mentionHighlights={editorSuggestions.mentionHighlights}
                    />
                  )}
                />
              )}
            />
          </div>

          <Button variant="neutral-primary" type="submit" disabled={isSubmitting || disabled}>
            {isSubmitting ? "Adding..." : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
};
