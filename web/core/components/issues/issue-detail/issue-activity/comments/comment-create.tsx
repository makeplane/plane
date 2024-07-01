import { FC, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
// types
import { TIssueComment } from "@plane/types";
// components
import { LiteTextEditor } from "@/components/editor/lite-text-editor/lite-text-editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { isEmptyHtmlString } from "@/helpers/string.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// editor
import { TActivityOperations } from "../root";

type TIssueCommentCreate = {
  projectId: string;
  workspaceSlug: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  issueId: string;
};

export const IssueCommentCreate: FC<TIssueCommentCreate> = (props) => {
  const { workspaceSlug, projectId, issueId, activityOperations, showAccessSpecifier = false } = props;
  // refs
  const editorRef = useRef<any>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;
  // form info
  const {
    handleSubmit,
    control,
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
              <LiteTextEditor
                workspaceId={workspaceId}
                id={"add_comment_" + issueId}
                value={"<p></p>"}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                onEnterKeyPress={(commentHTML) => {
                  console.log("commentHTML", commentHTML);
                  const isEmpty =
                    commentHTML?.trim() === "" ||
                    commentHTML === "<p></p>" ||
                    (isEmptyHtmlString(commentHTML ?? "") && !commentHTML?.includes("mention-component"));
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)();
                  }
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-[35px]"
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                showAccessSpecifier={showAccessSpecifier}
                isSubmitting={isSubmitting}
              />
            )}
          />
        )}
      />
    </div>
  );
};
