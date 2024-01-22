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

const fileService = new FileService();

type TIssueCommentCreateUpdate = {
  workspaceSlug: string;
  activityOperations: TActivityOperations;
  disabled: boolean;
};

export const IssueCommentCreateUpdate: FC<TIssueCommentCreateUpdate> = (props) => {
  const { workspaceSlug, activityOperations, disabled } = props;
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
    </div>
  );
};
