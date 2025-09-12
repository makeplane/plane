"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi, TExtensions } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, type TNameDescriptionLoader } from "@plane/types";
import { Loader } from "@plane/ui";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
const workspaceService = new WorkspaceService();

type TFormData = {
  id: string;
  description_html: string;
};

type Props = {
  containerClassName?: string;
  disabled?: boolean;
  disabledExtensions?: TExtensions[];
  editorRef?: React.RefObject<EditorRefApi>;
  entityId: string;
  fileAssetType: EFileAssetType;
  initialValue: string | undefined;
  onSubmit: (value: string) => Promise<void>;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  projectId?: string;
  setIsSubmitting: (initialValue: TNameDescriptionLoader) => void;
  swrDescription?: string | null | undefined;
  workspaceSlug: string;
};

/**
 * @description DescriptionInput component for rich text editor with autosave functionality using debounce
 * The component also makes an API call to save the description on unmount
 */
export const DescriptionInput: React.FC<Props> = observer((props) => {
  const {
    containerClassName,
    disabled,
    disabledExtensions,
    editorRef,
    entityId,
    fileAssetType,
    initialValue,
    onSubmit,
    placeholder,
    projectId,
    setIsSubmitting,
    swrDescription,
    workspaceSlug,
  } = props;
  // states
  const [localDescription, setLocalDescription] = useState({
    id: entityId,
    description_html: initialValue,
  });
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug);
  // translation
  const { t } = useTranslation();
  // form info
  const { handleSubmit, reset, control } = useForm<TFormData>({
    defaultValues: {
      id: entityId,
      description_html: initialValue || "",
    },
  });

  // submit handler
  const handleDescriptionFormSubmit = useCallback(
    async (formData: TFormData) => {
      await onSubmit(formData.description_html ?? "<p></p>");
    },
    [onSubmit]
  );

  // reset form values
  useEffect(() => {
    if (!entityId) return;
    reset({
      id: entityId,
      description_html: initialValue?.trim() === "" ? "<p></p>" : initialValue,
    });
    setLocalDescription({
      id: entityId,
      description_html: initialValue?.trim() === "" ? "<p></p>" : initialValue,
    });
    // Reset unsaved changes flag when form is reset
    hasUnsavedChanges.current = false;
  }, [entityId, initialValue, reset]);

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
    [entityId, handleSubmit]
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

  return (
    <>
      {localDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) => (
            <RichTextEditor
              editable={!disabled}
              ref={editorRef}
              id={entityId}
              disabledExtensions={disabledExtensions}
              initialValue={localDescription.description_html ?? "<p></p>"}
              value={swrDescription ?? null}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceDetails?.id ?? ""}
              projectId={projectId}
              dragDropEnabled
              onChange={(_description, description_html) => {
                setIsSubmitting("submitting");
                onChange(description_html);
                hasUnsavedChanges.current = true;
                debouncedFormSave();
              }}
              placeholder={placeholder ?? ((isFocused, value) => t(getDescriptionPlaceholderI18n(isFocused, value)))}
              searchMentionCallback={async (payload) =>
                await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                  ...payload,
                  project_id: projectId,
                })
              }
              containerClassName={containerClassName}
              uploadFile={async (blockId, file) => {
                try {
                  const { asset_id } = await uploadEditorAsset({
                    blockId,
                    data: {
                      entity_identifier: entityId,
                      entity_type: fileAssetType,
                    },
                    file,
                    projectId,
                    workspaceSlug,
                  });
                  return asset_id;
                } catch (error) {
                  console.log("Error in uploading asset:", error);
                  throw new Error("Asset upload failed. Please try again later.");
                }
              }}
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
