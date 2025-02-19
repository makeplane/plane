import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane constants
import { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorRefApi } from "@plane/editor";
// components
import { LiteTextEditor } from "@/components/editor";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// services
import { TInitiativeComment } from "@/plane-web/types/initiative";
import { FileService } from "@/services/file.service";
// local components
import { TInitiativeActivityOperations } from "../comment-tab-root";

const fileService = new FileService();

type TInitiativeCommentCreate = {
  initiativeId: string;
  workspaceSlug: string;
  activityOperations: TInitiativeActivityOperations;
};

export const InitiativeCommentCreate: FC<TInitiativeCommentCreate> = observer((props) => {
  const { workspaceSlug, initiativeId, activityOperations } = props;
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
  } = useForm<Partial<TInitiativeComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });

  const onSubmit = async (formData: Partial<TInitiativeComment>) => {
    await activityOperations
      .createComment(formData)
      .then(async (res) => {
        if (uploadedAssetIds.length > 0 && res) {
          await fileService.updateBulkInitiativeCommentAssetsUploadStatus(workspaceSlug, initiativeId, res?.id, {
            asset_ids: uploadedAssetIds,
          });
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
                id={"add_comment_" + initiativeId}
                value={"<p></p>"}
                workspaceSlug={workspaceSlug}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-min"
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                isSubmitting={isSubmitting}
                uploadFile={async (blockId, file) => {
                  const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
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
});
