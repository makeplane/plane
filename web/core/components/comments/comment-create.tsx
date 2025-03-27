import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane constants
import { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorRefApi } from "@plane/editor";
// components
import { TIssueComment, TCommentsOperations } from "@plane/types";
import { LiteTextEditor } from "@/components/editor";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { FileService } from "@/services/file.service";

type TCommentCreate = {
  entityId: string;
  workspaceSlug: string;
  activityOperations: TCommentsOperations;
  showToolbarInitially?: boolean;
  projectId?: string;
};

// services
const fileService = new FileService();
export const CommentCreate: FC<TCommentCreate> = observer((props) => {
  const { workspaceSlug, entityId, activityOperations, showToolbarInitially = false, projectId } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;
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

  const onSubmit = async (formData: Partial<TIssueComment>) => {
    activityOperations
      .createComment(formData)
      .then(async () => {
        if (uploadedAssetIds.length > 0) {
          if (projectId) {
            await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId.toString(), entityId, {
              asset_ids: uploadedAssetIds,
            });
          } else {
            await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, entityId, {
              asset_ids: uploadedAssetIds,
            });
          }
          setUploadedAssetIds([]);
        }
      })
      .finally(() => {
        reset({
          comment_html: "<p></p>",
        });
        editorRef.current?.clearEditor();
      });
  };

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);

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
                id={"add_comment_" + entityId}
                value={"<p></p>"}
                workspaceSlug={workspaceSlug}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-min [&_p]:!p-0 [&_p]:!text-base"
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                isSubmitting={isSubmitting}
                uploadFile={async (blockId, file) => {
                  const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
                  return asset_id;
                }}
                showToolbarInitially={showToolbarInitially}
                parentClassName="p-2"
              />
            )}
          />
        )}
      />
    </div>
  );
});
