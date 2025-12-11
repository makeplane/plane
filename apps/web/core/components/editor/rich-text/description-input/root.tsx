import { useCallback, useEffect, useState, useRef } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi, TExtensions } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { EFileAssetType, TNameDescriptionLoader } from "@plane/types";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// local imports
import { DescriptionInputLoader } from "./loader";
// services init
const workspaceService = new WorkspaceService();

type TFormData = {
  id: string;
  description_html: string;
  isMigrationUpdate: boolean;
};

type Props = {
  /**
   * @description Container class name, this will be used to add custom styles to the editor container
   */
  containerClassName?: string;
  /**
   * @description Disabled, this will be used to disable the editor
   */
  disabled?: boolean;
  /**
   * @description Disabled extensions, this will be used to disable the extensions in the editor
   */
  disabledExtensions?: TExtensions[];
  /**
   * @description Editor ref, this will be used to imperatively attach editor related helper functions
   */
  editorRef?: React.RefObject<EditorRefApi>;
  /**
   * @description Entity ID, this will be used for file uploads and as the unique identifier for the entity
   */
  entityId: string;
  /**
   * @description File asset type, this will be used to upload the file to the editor
   */
  fileAssetType: EFileAssetType;
  /**
   * @description Initial value, pass the actual description to initialize the editor
   */
  initialValue: string | undefined;
  /**
   * @description Submit handler, the actual function which will be called when the form is submitted
   */
  onSubmit: (value: string, isMigrationUpdate?: boolean) => Promise<void>;
  /**
   * @description Placeholder, if not provided, the placeholder will be the default placeholder
   */
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  /**
   * @description projectId, if not provided, the entity will be considered as a workspace entity
   */
  projectId?: string;
  /**
   * @description Set is submitting, use it to set the loading state of the form
   */
  setIsSubmitting: (initialValue: TNameDescriptionLoader) => void;
  /**
   * @description SWR description, use it only if you want to sync changes in realtime(pseudo realtime)
   */
  swrDescription?: string | null | undefined;
  /**
   * @description Workspace slug, this will be used to get the workspace details
   */
  workspaceSlug: string;
  /**
   * @description Issue sequence id, this will be used to get the issue sequence id
   */
  issueSequenceId?: number;
};

/**
 * @description DescriptionInput component for rich text editor with autosave functionality using debounce
 * The component also makes an API call to save the description on unmount
 */
export const DescriptionInput = observer(function DescriptionInput(props: Props) {
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
    issueSequenceId,
  } = props;
  // states
  const [localDescription, setLocalDescription] = useState<TFormData>({
    id: entityId,
    description_html: initialValue?.trim() ?? "",
    isMigrationUpdate: false,
  });
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug);
  // translation
  const { t } = useTranslation();
  // form info
  const { handleSubmit, reset, control, setValue } = useForm<TFormData>({
    defaultValues: {
      id: entityId,
      description_html: initialValue?.trim() ?? "",
      isMigrationUpdate: false,
    },
  });

  // submit handler
  const handleDescriptionFormSubmit = useCallback(
    async (formData: TFormData) => {
      await onSubmit(formData.description_html, formData.isMigrationUpdate);
    },
    [onSubmit]
  );

  // reset form values
  useEffect(() => {
    if (!entityId) return;
    reset({
      id: entityId,
      description_html: initialValue?.trim() === "" ? "<p></p>" : (initialValue ?? "<p></p>"),
      isMigrationUpdate: false,
    });
    setLocalDescription({
      id: entityId,
      description_html: initialValue?.trim() === "" ? "<p></p>" : (initialValue ?? "<p></p>"),
      isMigrationUpdate: false,
    });
    // Reset unsaved changes flag when form is reset
    hasUnsavedChanges.current = false;
  }, [entityId, initialValue, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)()
        .catch((error) => console.error(`Failed to save description for ${entityId}:`, error))
        .finally(() => {
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

  if (!workspaceDetails) return null;

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
              issueSequenceId={issueSequenceId}
              disabledExtensions={disabledExtensions}
              initialValue={localDescription.description_html ?? "<p></p>"}
              value={swrDescription ?? null}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceDetails.id}
              projectId={projectId}
              dragDropEnabled
              onChange={(_description, description_html, options) => {
                setIsSubmitting("submitting");
                onChange(description_html);
                setValue("isMigrationUpdate", options?.isMigrationUpdate ?? false);
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
              duplicateFile={async (assetId: string) => {
                try {
                  const { asset_id } = await duplicateEditorAsset({
                    assetId,
                    entityType: fileAssetType,
                    projectId,
                    workspaceSlug,
                  });
                  return asset_id;
                } catch {
                  throw new Error("Asset duplication failed. Please try again later.");
                }
              }}
            />
          )}
        />
      ) : (
        <DescriptionInputLoader />
      )}
    </>
  );
});
