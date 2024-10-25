"use client";

import { FC, useCallback, useRef } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
// plane editor
import { convertBinaryDataToBase64String, EditorRefApi } from "@plane/editor";
// types
import { EFileAssetType } from "@plane/types/src/enums";
// plane ui
import { Loader } from "@plane/ui";
// components
import { CollaborativeRichTextEditor, CollaborativeRichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useIssueDescription } from "@/hooks/use-issue-description";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

export type IssueDescriptionInputProps = {
  containerClassName?: string;
  descriptionHTML: string;
  disabled?: boolean;
  fetchDescription: () => Promise<any>;
  issueId: string;
  issueOperations: TIssueOperations;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  projectId: string;
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  updateDescription: (data: string) => Promise<any>;
  workspaceSlug: string;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    descriptionHTML,
    disabled,
    fetchDescription,
    issueId,
    placeholder,
    projectId,
    setIsSubmitting,
    updateDescription,
    workspaceSlug,
  } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id?.toString() ?? "";
  // use issue description
  const { descriptionBinary, resolveConflictsAndUpdateDescription } = useIssueDescription({
    descriptionHTML,
    id: issueId,
    fetchDescription,
    updateDescription,
  });

  const debouncedDescriptionSave = useCallback(
    debounce(async (updatedDescription: Uint8Array) => {
      const editor = editorRef.current;
      if (!editor) return;
      const encodedDescription = convertBinaryDataToBase64String(updatedDescription);
      await resolveConflictsAndUpdateDescription(encodedDescription, editor);
      setIsSubmitting("submitted");
    }, 1500),
    []
  );

  if (!descriptionBinary)
    return (
      <Loader className="min-h-[120px] max-h-64 space-y-2 overflow-hidden rounded-md">
        <Loader.Item width="100%" height="26px" />
        <div className="flex items-center gap-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="400px" height="26px" />
        </div>
        <div className="flex items-center gap-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="400px" height="26px" />
        </div>
        <Loader.Item width="80%" height="26px" />
        <div className="flex items-center gap-2">
          <Loader.Item width="50%" height="26px" />
        </div>
        <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
          <Loader.Item width="100px" height="26px" />
          <Loader.Item width="50px" height="26px" />
        </div>
      </Loader>
    );

  return (
    <>
      {!disabled ? (
        <CollaborativeRichTextEditor
          containerClassName={containerClassName}
          value={descriptionBinary}
          onChange={(val) => {
            setIsSubmitting("submitting");
            debouncedDescriptionSave(val);
          }}
          dragDropEnabled
          id={issueId}
          placeholder={placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)}
          projectId={projectId}
          ref={editorRef}
          uploadFile={async (file) => {
            try {
              const { asset_id } = await fileService.uploadProjectAsset(
                workspaceSlug,
                projectId,
                {
                  entity_identifier: issueId,
                  entity_type: EFileAssetType.ISSUE_DESCRIPTION,
                },
                file
              );
              return asset_id;
            } catch (error) {
              console.log("Error in uploading issue asset:", error);
              throw new Error("Asset upload failed. Please try again later.");
            }
          }}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <CollaborativeRichTextReadOnlyEditor
          containerClassName={containerClassName}
          descriptionHTML={descriptionHTML}
          fetchDescription={fetchDescription}
          id={issueId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      )}
    </>
  );
});
