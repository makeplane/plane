import { FC, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
// plane constants
import { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorRefApi } from "@plane/editor";
// components
import { LiteTextEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web imports
import { TTeamspaceComment } from "@/plane-web/types";
// local components
import { TTeamspaceActivityOperations } from "../comments";

type TTeamspaceCommentCreate = {
  teamspaceId: string;
  workspaceSlug: string;
  activityOperations: TTeamspaceActivityOperations;
};

export const TeamspaceCommentCreate: FC<TTeamspaceCommentCreate> = (props) => {
  const { workspaceSlug, teamspaceId, activityOperations } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TTeamspaceComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;
  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);

  const onSubmit = async (formData: Partial<TTeamspaceComment>) => {
    await activityOperations.createComment(formData).finally(() => {
      reset({
        comment_html: "<p></p>",
      });
      editorRef.current?.clearEditor();
    });
  };

  return (
    <div
      className={cn("sticky bottom-0 z-[4] bg-custom-background-100 sm:static")}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty && !isSubmitting)
          handleSubmit(onSubmit)(e);
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
              <LiteTextEditor
                workspaceId={workspaceId}
                id={"add_comment_" + teamspaceId}
                placeholder="Write your comment"
                value={"<p></p>"}
                workspaceSlug={workspaceSlug}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                isSubmitting={isSubmitting}
                uploadFile={async (file) => {
                  const { asset_id } = await activityOperations.uploadCommentAsset(file);
                  return asset_id;
                }}
                showToolbarInitially={false}
              />
            )}
          />
        )}
      />
    </div>
  );
};
