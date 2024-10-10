import { FC, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
// plane editor
import { EditorRefApi } from "@plane/editor";
// types
import { TIssueComment } from "@plane/types";
// components
import { LiteTextEditor } from "@/components/editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useIssueDetail, useWorkspace } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
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
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  const { peekIssue } = useIssueDetail();
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
                id={"add_comment_" + issueId}
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
                containerClassName="min-h-[35px]"
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
              />
            )}
          />
        )}
      />
    </div>
  );
};
