"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
// plane editor
import { EditorRefApi } from "@plane/editor";
// types
import { EFileAssetType } from "@plane/types/src/enums";
// components
import { CollaborativeRichTextEditor, CollaborativeRichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
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

  return (
    <>
      {!disabled ? (
        <CollaborativeRichTextEditor
          containerClassName={containerClassName}
          descriptionHTML={descriptionHTML}
          dragDropEnabled
          fetchDescription={fetchDescription}
          id={issueId}
          placeholder={placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)}
          projectId={projectId}
          ref={editorRef}
          updateDescription={updateDescription}
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
