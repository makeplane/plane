"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TIssue, TNameDescriptionLoader } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { getDescriptionPlaceholderI18n } from "@plane/utils";
import { RichTextEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
// hooks
import { useEditorAsset, useWorkspace } from "@/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
const workspaceService = new WorkspaceService();

export type IssueDescriptionInputProps = {
  containerClassName?: string;
  editorRef?: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  initialValue: string | undefined;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: TNameDescriptionLoader) => void;
  swrIssueDescription?: string | null | undefined;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    editorRef,
    workspaceSlug,
    projectId,
    issueId,
    disabled,
    swrIssueDescription,
    initialValue,
    issueOperations,
    setIsSubmitting,
    placeholder,
  } = props;
  // states
  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issueId,
    description_html: initialValue,
  });
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  // store hooks
  const { uploadEditorAsset } = useEditorAsset();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id?.toString();
  // form info
  const { handleSubmit, reset, control } = useForm<TIssue>({
    defaultValues: {
      description_html: initialValue,
    },
  });
  // i18n
  const { t } = useTranslation();

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TIssue>) => {
      await issueOperations.update(workspaceSlug, projectId, issueId, {
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, projectId, issueId, issueOperations]
  );

  // reset form values
  useEffect(() => {
    if (!issueId) return;
    reset({
      id: issueId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalIssueDescription({
      id: issueId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    // Reset unsaved changes flag when form is reset
    hasUnsavedChanges.current = false;
  }, [initialValue, issueId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => {
        setIsSubmitting("submitted");
        hasUnsavedChanges.current = false;
      });
    }, 1500),
    [handleSubmit, issueId]
  );

  // Save on unmount if there are unsaved changes
  useEffect(
    () => () => {
      debouncedFormSave.cancel();

      if (hasUnsavedChanges.current) {
        handleSubmit(handleDescriptionFormSubmit)()
          .catch((error) => {
            console.error("Failed to save description on unmount:", error);
          })
          .finally(() => {
            setIsSubmitting("submitted");
            hasUnsavedChanges.current = false;
          });
      }
    },
    // since we don't want to save on unmount if there are no unsaved changes, no deps are needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!workspaceId) return null;

  return (
    <>
      {localIssueDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) => (
            <RichTextEditor
              editable={!disabled}
              id={issueId}
              initialValue={localIssueDescription.description_html ?? "<p></p>"}
              value={swrIssueDescription ?? null}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceId}
              projectId={projectId}
              dragDropEnabled
              onChange={(_description: object, description_html: string) => {
                setIsSubmitting("submitting");
                onChange(description_html);
                hasUnsavedChanges.current = true;
                debouncedFormSave();
              }}
              placeholder={
                placeholder
                  ? placeholder
                  : (isFocused, value) => t(`${getDescriptionPlaceholderI18n(isFocused, value)}`)
              }
              searchMentionCallback={async (payload) =>
                await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                  ...payload,
                  project_id: projectId?.toString() ?? "",
                  issue_id: issueId?.toString(),
                })
              }
              containerClassName={containerClassName}
              uploadFile={async (blockId, file) => {
                try {
                  const { asset_id } = await uploadEditorAsset({
                    blockId,
                    data: {
                      entity_identifier: issueId,
                      entity_type: EFileAssetType.ISSUE_DESCRIPTION,
                    },
                    file,
                    projectId,
                    workspaceSlug,
                  });
                  return asset_id;
                } catch (error) {
                  console.log("Error in uploading work item asset:", error);
                  throw new Error("Asset upload failed. Please try again later.");
                }
              }}
              ref={editorRef}
            />
          )}
        />
      ) : (
        <Loader>
          <Loader.Item height="150px" />
        </Loader>
      )}
    </>
  );
});
