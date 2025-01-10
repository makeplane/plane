"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { TIssue, TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// services
import { FileService } from "@/services/file.service";
const workspaceService = new WorkspaceService();
const fileService = new FileService();

export type IssueDescriptionInputProps = {
  containerClassName?: string;
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

  const { handleSubmit, reset, control } = useForm<TIssue>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: issueId,
    description_html: initialValue,
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TIssue>) => {
      await issueOperations.update(workspaceSlug, projectId, issueId, {
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, projectId, issueId, issueOperations]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

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
  }, [initialValue, issueId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, issueId]
  );

  return (
    <>
      {localIssueDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) =>
            !disabled ? (
              <RichTextEditor
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
                  debouncedFormSave();
                }}
                placeholder={
                  placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)
                }
                searchMentionCallback={async (payload) =>
                  await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                    ...payload,
                    project_id: projectId?.toString() ?? "",
                    issue_id: issueId?.toString(),
                  })
                }
                containerClassName={containerClassName}
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
              />
            ) : (
              <RichTextReadOnlyEditor
                id={issueId}
                initialValue={localIssueDescription.description_html ?? ""}
                containerClassName={containerClassName}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            )
          }
        />
      ) : (
        <Loader>
          <Loader.Item height="150px" />
        </Loader>
      )}
    </>
  );
});
