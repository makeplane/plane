import { FC } from "react";
import { useForm, Controller } from "react-hook-form";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
import { Button } from "@plane/ui";
// types
import { TActivityOperations } from "../root";

type TIssueCommentCreateUpdate = {
  activityOperations: TActivityOperations;
};

type TComment = {
  comment_html: string;
};

const defaultValues: TComment = {
  comment_html: "",
};

export const IssueCommentCreateUpdate: FC<TIssueCommentCreateUpdate> = (props) => {
  const { activityOperations } = props;
  // react hook form
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<TComment>({ defaultValues });

  return (
    <div>
      {/* <Controller
        name="comment_html"
        control={control}
        render={({ field: { value, onChange } }) => (
          <LiteTextEditorWithRef
            onEnterKeyPress={(e) => {
              userStore.requiredLogin(() => {
                handleSubmit(onSubmit)(e);
              });
            }}
            cancelUploadImage={fileService.cancelUpload}
            uploadFile={fileService.getUploadFileFunction(workspace_slug as string)}
            deleteFile={fileService.deleteImage}
            restoreFile={fileService.restoreImage}
            ref={editorRef}
            value={
              !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                ? watch("comment_html")
                : value
            }
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
                  userStore.requiredLogin(() => {
                    handleSubmit(onSubmit)(e);
                  });
                }}
              >
                {isSubmitting ? "Adding..." : "Comment"}
              </Button>
            }
          />
        )}
      /> */}
    </div>
  );
};
