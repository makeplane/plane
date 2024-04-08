import { FC, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Globe2, Lock, LucideIcon } from "lucide-react";
// editor
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// types
import { TIssueComment } from "@plane/types";
// ui
import { Button } from "@plane/ui";
// helpers
import { isEmptyHtmlString } from "@/helpers/string.helper";
// hooks
import { useMention, useWorkspace } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";
import { TActivityOperations } from "../root";

const fileService = new FileService();

type TIssueCommentCreate = {
  projectId: string;
  workspaceSlug: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
};

type TCommentAccessType = {
  icon: LucideIcon;
  key: string;
  label: "Private" | "Public";
};

const COMMENT_ACCESS_SPECIFIERS: TCommentAccessType[] = [
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
  const { workspaceSlug, projectId, activityOperations, showAccessSpecifier = false } = props;
  // refs
  const editorRef = useRef<any>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug: workspaceSlug as string,
    projectId: projectId as string,
  });
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TIssueComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });

  const onSubmit = async (formData: Partial<TIssueComment>) =>
    await activityOperations.createComment(formData).finally(() => {
      reset({
        comment_html: "<p></p>",
      });
      editorRef.current?.clearEditor();
    });

  const commentHTML = watch("comment_html");
  const isEmpty = commentHTML?.trim() === "" || commentHTML === "<p></p>" || isEmptyHtmlString(commentHTML ?? "");

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !isEmpty && !isSubmitting) handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <LiteTextEditorWithRef
                onEnterKeyPress={(e) => handleSubmit(onSubmit)(e)}
                cancelUploadImage={fileService.cancelUpload}
                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                deleteFile={fileService.getDeleteImageFunction(workspaceId)}
                restoreFile={fileService.getRestoreImageFunction(workspaceId)}
                ref={editorRef}
                value={value ?? "<p></p>"}
                customClassName="p-2"
                editorContentCustomClassNames="min-h-[35px]"
                debouncedUpdatesEnabled={false}
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                mentionSuggestions={mentionSuggestions}
                mentionHighlights={mentionHighlights}
                commentAccessSpecifier={
                  showAccessSpecifier
                    ? {
                        accessValue: accessValue ?? "INTERNAL",
                        onAccessChange,
                        showAccessSpecifier,
                        commentAccess: COMMENT_ACCESS_SPECIFIERS,
                      }
                    : undefined
                }
                submitButton={
                  <Button
                    type="submit"
                    variant="primary"
                    className="!px-2.5 !py-1.5 !text-xs"
                    onClick={(e) => handleSubmit(onSubmit)(e)}
                    disabled={isEmpty}
                    loading={isSubmitting}
                  >
                    Comment
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
