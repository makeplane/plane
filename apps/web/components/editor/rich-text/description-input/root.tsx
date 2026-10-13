/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
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
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import { isDescriptionConflictError } from "./conflict";
import { DescriptionInputLoader } from "./loader";
// services init
const workspaceService = new WorkspaceService();

const EMPTY_DESCRIPTION_HTML = "<p></p>";

const normalizeDescription = (value: string | undefined) =>
  value?.trim() === "" ? EMPTY_DESCRIPTION_HTML : (value ?? EMPTY_DESCRIPTION_HTML);

type TFormData = {
  id: string;
  description_html: string;
  description_json?: object;
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
  editorRef?: React.RefObject<EditorRefApi | null>;
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
   * @description Key, to ensure the editor is re-rendered when the key changes
   */
  key: string;
  /**
   * @description Submit handler, the actual function which will be called when the form is submitted.
   * `base_description_html` is the description the editor content is based on; send it to the API so it can
   * reject saves made on top of an outdated copy. Rethrow the conflict error (see `isDescriptionConflictError`)
   * to let the user resolve it.
   */
  onSubmit: (
    value: {
      description_html: string;
      description_json: object | undefined;
      base_description_html: string;
    },
    isMigrationUpdate?: boolean
  ) => Promise<void>;
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
    issueSequenceId,
    onSubmit,
    placeholder,
    projectId,
    setIsSubmitting,
    swrDescription,
    workspaceSlug,
  } = props;
  // states
  const [localDescription, setLocalDescription] = useState<TFormData>({
    id: entityId,
    description_html: initialValue?.trim() ?? "",
    isMigrationUpdate: false,
  });
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  // ref to track last saved content (to skip onChange when content hasn't actually changed)
  const lastSavedContent = useRef(normalizeDescription(initialValue));
  // ref to track the description the editor content is based on. Unlike lastSavedContent, it does not follow
  // initialValue, since a refetched description is not loaded into an editor that is already mounted.
  const baseDescription = useRef(normalizeDescription(initialValue));
  // ref to chain saves, so a save always starts from the base left by the previous one
  const pendingSave = useRef<Promise<void>>(Promise.resolve());
  const internalEditorRef = useRef<EditorRefApi>(null);
  const resolvedEditorRef = editorRef ?? internalEditorRef;
  // latest stored description, set when a save is rejected because someone else changed the description
  const [conflictingDescription, setConflictingDescription] = useState<string | null>(null);
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
      try {
        await onSubmit(
          {
            description_html: formData.description_html,
            description_json: formData.description_json,
            base_description_html: baseDescription.current,
          },
          formData.isMigrationUpdate
        );
      } catch (error) {
        if (!isDescriptionConflictError(error)) throw error;
        setConflictingDescription(normalizeDescription(error.description_html));
        return;
      }
      // Update lastSavedContent and the base after successful save
      lastSavedContent.current = formData.description_html;
      baseDescription.current = formData.description_html;
    },
    [onSubmit]
  );

  const saveDescription = () => {
    const save = pendingSave.current.then(() => handleSubmit(handleDescriptionFormSubmit)());
    pendingSave.current = save.catch(() => undefined);
    return save;
  };

  // reset form values
  useEffect(() => {
    if (!entityId) return;
    const normalizedValue = initialValue?.trim() === "" ? "<p></p>" : (initialValue ?? "<p></p>");
    // Update last saved content when entity/initialValue changes
    lastSavedContent.current = normalizedValue;
    reset({
      id: entityId,
      description_html: normalizedValue,
      isMigrationUpdate: false,
    });
    setLocalDescription({
      id: entityId,
      description_html: normalizedValue,
      isMigrationUpdate: false,
    });
    // Reset unsaved changes flag when form is reset
    hasUnsavedChanges.current = false;
  }, [entityId, initialValue, reset]);

  // the editor is (re)initialised with initialValue when the entity changes
  useEffect(() => {
    baseDescription.current = normalizeDescription(initialValue);
    // only the entity switch should move the base, a refetched initialValue is not shown in the editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  // the editor content is replaced when a synced description is passed
  useEffect(() => {
    if (swrDescription == null) return;
    baseDescription.current = swrDescription;
  }, [swrDescription]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      saveDescription()
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
        saveDescription()
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

  const handleLoadLatestDescription = () => {
    if (conflictingDescription === null) return;
    debouncedFormSave.cancel();
    lastSavedContent.current = conflictingDescription;
    baseDescription.current = conflictingDescription;
    hasUnsavedChanges.current = false;
    reset({
      id: entityId,
      description_html: conflictingDescription,
      isMigrationUpdate: false,
    });
    resolvedEditorRef.current?.setEditorValue(conflictingDescription, false);
    setConflictingDescription(null);
  };

  if (!workspaceDetails) return null;

  if (!localDescription.description_html) return <DescriptionInputLoader />;

  return (
    <>
      <ConfirmDialog
        isOpen={conflictingDescription !== null}
        variant="warning"
        title={t("description_conflict.title")}
        content={t("description_conflict.content")}
        primaryButtonText={{ default: t("description_conflict.load_latest") }}
        secondaryButtonText={t("description_conflict.keep_editing")}
        handleSubmit={handleLoadLatestDescription}
        handleClose={() => setConflictingDescription(null)}
        isSubmitting={false}
      />
      <Controller
        name="description_html"
        control={control}
        render={({ field: { onChange } }) => (
          <RichTextEditor
            key={entityId}
            editable={!disabled}
            ref={resolvedEditorRef}
            id={entityId}
            issueSequenceId={issueSequenceId}
            disabledExtensions={disabledExtensions}
            initialValue={localDescription.description_html ?? "<p></p>"}
            value={swrDescription ?? null}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceDetails.id}
            projectId={projectId}
            dragDropEnabled
            onChange={(description_json, description_html, options) => {
              if (description_html === lastSavedContent.current) return;
              setIsSubmitting("submitting");
              onChange(description_html);
              setValue("isMigrationUpdate", !!options?.isMigrationUpdate);
              setValue("description_json", description_json);
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
                throw new Error("Asset upload failed. Please try again later.", { cause: error });
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
    </>
  );
});
