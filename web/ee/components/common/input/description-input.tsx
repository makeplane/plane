"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
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

interface IFormData {
  id: string;
  description_html: string;
}

export type DescriptionInputProps = {
  workspaceSlug: string;
  projectId?: string;
  itemId: string;
  initialValue: string | undefined;
  onSubmit: (value: string) => Promise<void>;
  fileAssetType: EFileAssetType;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: TNameDescriptionLoader) => void;
  swrDescription?: string | null | undefined;
  containerClassName?: string;
  disabled?: boolean;
};

export const DescriptionInput: FC<DescriptionInputProps> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    itemId,
    initialValue,
    onSubmit,
    fileAssetType,
    placeholder,
    setIsSubmitting,
    swrDescription,
    containerClassName,
    disabled,
  } = props;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();

  // states
  const [localDescription, setLocalDescription] = useState({
    id: itemId,
    description_html: initialValue,
  });

  // form
  const { handleSubmit, reset, control } = useForm<IFormData>({
    defaultValues: {
      id: itemId,
      description_html: initialValue || "",
    },
  });

  // handlers
  const handleDescriptionFormSubmit = useCallback(
    async (formData: IFormData) => {
      await onSubmit(formData.description_html ?? "<p></p>");
    },
    [onSubmit]
  );

  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!itemId) return;
    reset({
      id: itemId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalDescription({
      id: itemId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
  }, [initialValue, itemId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, itemId]
  );

  return (
    <>
      {localDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) =>
            !disabled ? (
              <RichTextEditor
                id={itemId}
                initialValue={localDescription.description_html ?? "<p></p>"}
                value={swrDescription ?? null}
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
                  })
                }
                containerClassName={containerClassName}
                uploadFile={async (file) => {
                  const params = {
                    entity_identifier: itemId,
                    entity_type: fileAssetType,
                  };
                  try {
                    const uploadAsset = projectId
                      ? fileService.uploadProjectAsset(workspaceSlug, projectId, params, file)
                      : fileService.uploadWorkspaceAsset(workspaceSlug, params, file);
                    const { asset_id } = await uploadAsset;
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
              />
            ) : (
              <RichTextReadOnlyEditor
                id={itemId}
                initialValue={localDescription.description_html ?? ""}
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
