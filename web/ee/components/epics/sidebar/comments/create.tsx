import { FC, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { EIssueServiceType, EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorRefApi } from "@plane/editor";
// types
import { TIssueComment } from "@plane/types";
// components
import { LiteTextEditor } from "@/components/editor";
import { TActivityOperations } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useIssueDetail, useWorkspace } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
// editor

type TEpicCommentCreate = {
  projectId: string;
  workspaceSlug: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  epicId: string;
};

export const EpicCommentCreate: FC<TEpicCommentCreate> = (props) => {
  const { workspaceSlug, projectId, epicId, activityOperations, showAccessSpecifier = false } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  const { peekIssue } = useIssueDetail(EIssueServiceType.EPICS);
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
    await activityOperations
      .createComment(formData)
      .then(async (res) => {
        if (uploadedAssetIds.length > 0) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, res.id, {
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
  const isEmpty = isCommentEmpty(commentHTML);

  return (
    <div
      className={cn("sticky bottom-0 z-[4] bg-custom-background-100 sm:static", {
        "-bottom-5": !peekIssue,
      })}
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
                id={"add_comment_" + epicId}
                value={"<p></p>"}
                projectId={projectId}
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
                showAccessSpecifier={showAccessSpecifier}
                isSubmitting={isSubmitting}
                uploadFile={async (file) => {
                  const { asset_id } = await activityOperations.uploadCommentAsset(file);
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
};
