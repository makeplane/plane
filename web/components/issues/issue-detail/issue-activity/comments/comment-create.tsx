import { FC, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
import { Button } from "@plane/ui";
// services
import { FileService } from "services/file.service";
// types
import { TActivityOperations } from "../root";
import { TIssueComment } from "@plane/types";
// icons
import { Globe2, Lock } from "lucide-react";

const fileService = new FileService();

type TIssueCommentCreate = {
  workspaceSlug: string;
  activityOperations: TActivityOperations;
  disabled: boolean;
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

export const IssueCommentCreate: FC<TIssueCommentCreate> = (props) => {
  const { workspaceSlug, activityOperations, disabled, showAccessSpecifier = false } = props;
  // refs
  const editorRef = useRef<any>(null);
  // react hook form
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TIssueComment>>({ defaultValues: { comment_html: "<p></p>" } });

  const onSubmit = async (formData: Partial<TIssueComment>) => {
    await activityOperations.createComment(formData).finally(() => {
      reset({ comment_html: "" });
      editorRef.current?.clearEditor();
    });
  };

  return (
    <div>
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <LiteTextEditorWithRef
                onEnterKeyPress={(e) => {
                  handleSubmit(onSubmit)(e);
                }}
                cancelUploadImage={fileService.cancelUpload}
                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                deleteFile={fileService.deleteImage}
                restoreFile={fileService.restoreImage}
                ref={editorRef}
                value={!value ? "<p></p>" : value}
                customClassName="p-2"
                editorContentCustomClassNames="min-h-[35px]"
                debouncedUpdatesEnabled={false}
                onChange={(comment_json: Object, comment_html: string) => {
                  onChange(comment_html);
                }}
                commentAccessSpecifier={
                  showAccessSpecifier
                    ? { accessValue: accessValue ?? "INTERNAL", onAccessChange, showAccessSpecifier, commentAccess }
                    : undefined
                }
                submitButton={
                  <Button
                    disabled={isSubmitting || disabled}
                    variant="primary"
                    type="submit"
                    className="!px-2.5 !py-1.5 !text-xs"
                    onClick={(e) => {
                      handleSubmit(onSubmit)(e);
                    }}
                  >
                    {isSubmitting ? "Adding..." : "Comment"}
                  </Button>
                }
              />
            )}
          />
        )}
      />
    </div>
  );
};
