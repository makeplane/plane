"use client";

import { FC, useCallback, useRef } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
// plane editor
import { convertBinaryDataToBase64String, EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// types
import { EFileAssetType } from "@plane/types/src/enums";
// plane ui
import { Loader } from "@plane/ui";
// components
import { CollaborativeRichTextEditor, CollaborativeRichTextReadOnlyEditor } from "@/components/editor";
import { IssueVersionHistory } from "@/components/issues";
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
  descriptionBinary: string | null;
  descriptionHTML: string;
  disabled?: boolean;
  issueId: string;
  key: string;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  projectId: string;
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  updateDescription: (data: string) => Promise<ArrayBuffer>;
  workspaceSlug: string;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    descriptionBinary: savedDescriptionBinary,
    descriptionHTML,
    disabled,
    issueId,
    placeholder,
    projectId,
    setIsSubmitting,
    updateDescription,
    workspaceSlug,
  } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const readOnlyEditorRef = useRef<EditorReadOnlyRefApi>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id?.toString() ?? "";
  // use issue description
  const { descriptionBinary, resolveConflictsAndUpdateDescription } = useIssueDescription({
    descriptionBinary: savedDescriptionBinary,
    descriptionHTML,
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
    <div>
      {!disabled ? (
        <CollaborativeRichTextEditor
          key={issueId}
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
          ref={readOnlyEditorRef}
          containerClassName={containerClassName}
          descriptionBinary={savedDescriptionBinary}
          descriptionHTML={descriptionHTML}
          id={issueId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      )}
      {/* version history overlay */}
      <IssueVersionHistory
        disabled={!!disabled}
        editorRef={editorRef.current}
        issueId={issueId}
        readOnlyEditorRef={readOnlyEditorRef.current}
      />
    </div>
  );
});
