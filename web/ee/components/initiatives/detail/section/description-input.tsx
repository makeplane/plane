"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiative } from "@/plane-web/types/initiative";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

export type InitiativeDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  initiativeId: string;
  initialValue: string | undefined;
  disabled?: boolean;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
};

export const InitiativeDescriptionInput: FC<InitiativeDescriptionInputProps> = observer((props) => {
  const { containerClassName, workspaceSlug, initiativeId, disabled, initialValue, setIsSubmitting, placeholder } =
    props;

  const {
    initiative: { updateInitiative },
  } = useInitiatives();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const { handleSubmit, reset, control } = useForm<TInitiative>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const [localIssueDescription, setLocalIssueDescription] = useState({
    id: initiativeId,
    description_html: initialValue,
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TInitiative>) => {
      await updateInitiative(workspaceSlug, initiativeId, {
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, initiativeId]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!initiativeId) return;
    reset({
      id: initiativeId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalIssueDescription({
      id: initiativeId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
  }, [initialValue, initiativeId, reset]);

  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, initiativeId]
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
                id={initiativeId}
                initialValue={localIssueDescription.description_html ?? "<p></p>"}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                memberIds={workspaceMemberIds || []}
                dragDropEnabled
                onChange={(_description: object, description_html: string) => {
                  setIsSubmitting("submitting");
                  onChange(description_html);
                  debouncedFormSave();
                }}
                placeholder={
                  placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)
                }
                containerClassName={containerClassName}
                uploadFile={async (file) => {
                  try {
                    const { asset_id } = await fileService.uploadWorkspaceAsset(
                      workspaceSlug,
                      {
                        entity_identifier: initiativeId,
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
                id={initiativeId}
                initialValue={localIssueDescription.description_html ?? ""}
                containerClassName={containerClassName}
                workspaceSlug={workspaceSlug}
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
