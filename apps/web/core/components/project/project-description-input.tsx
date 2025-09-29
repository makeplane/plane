"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TProject, TNameDescriptionLoader } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { getDescriptionPlaceholderI18n } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProject } from "@/hooks/store/use-project";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
const workspaceService = new WorkspaceService();

export type ProjectDescriptionInputProps = {
  containerClassName?: string;
  editorRef?: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  initialValue: string | undefined | null;
  disabled?: boolean;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: TNameDescriptionLoader) => void;
  swrProjectDescription?: string | null | undefined;
};

export const ProjectDescriptionInput: FC<ProjectDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    editorRef,
    workspaceSlug,
    projectId,
    disabled,
    swrProjectDescription,
    initialValue,
    setIsSubmitting,
    placeholder,
  } = props;
  
  // states
  const [isInitialized, setIsInitialized] = useState(false);
  const [localProjectDescription, setLocalProjectDescription] = useState({
    id: projectId,
    description_html: initialValue || "<p></p>",
  });
  
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  
  // store hooks
  const { uploadEditorAsset } = useEditorAsset();
  const { getWorkspaceBySlug } = useWorkspace();
  const { updateProject } = useProject();
  
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id?.toString();
  
  // form info
  const { handleSubmit, reset, control } = useForm<TProject>({
    defaultValues: {
      description_html: initialValue || "<p></p>",
    },
  });
  
  // i18n
  const { t } = useTranslation();

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TProject>) => {
      await updateProject(workspaceSlug, projectId, {
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [workspaceSlug, projectId, updateProject]
  );

  // Initialize component
  useEffect(() => {
    if (!projectId) return;
    
    const descriptionValue = initialValue || "<p></p>";
    
    reset({
      id: projectId,
      description_html: descriptionValue,
    });
    
    setLocalProjectDescription({
      id: projectId,
      description_html: descriptionValue,
    });
    
    setIsInitialized(true);
    hasUnsavedChanges.current = false;
  }, [initialValue, projectId, reset]);

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
    [handleSubmit, projectId]
  );

  // Save on unmount if there are unsaved changes
  useEffect(
    () => () => {
      debouncedFormSave.cancel();

      if (hasUnsavedChanges.current) {
        handleSubmit(handleDescriptionFormSubmit)()
          .catch((error) => {
            console.error("Failed to save project description on unmount:", error);
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

  // Show loader while initializing or if workspace is not available
  if (!workspaceId || !isInitialized) {
    return (
      <Loader>
        <Loader.Item height="150px" />
      </Loader>
    );
  }

  return (
    <Controller
      name="description_html"
      control={control}
      render={({ field: { onChange } }) => (
        <RichTextEditor
          editable={!disabled}
          id={projectId}
          initialValue={localProjectDescription.description_html}
          value={swrProjectDescription ?? null}
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
              : (isFocused, value) => 
                  isFocused 
                    ? "添加项目描述..." 
                    : value 
                    ? "" 
                    : "点击添加项目描述"
          }
          searchMentionCallback={async (payload) =>
            await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
              ...payload,
              project_id: projectId?.toString() ?? "",
            })
          }
          containerClassName={containerClassName}
          uploadFile={async (blockId, file) => {
            try {
              const { asset_id } = await uploadEditorAsset({
                blockId,
                data: {
                  entity_identifier: projectId,
                  entity_type: EFileAssetType.PROJECT_DESCRIPTION,
                },
                file,
                projectId,
                workspaceSlug,
              });
              return asset_id;
            } catch (error) {
              console.log("Error in uploading project asset:", error);
              throw new Error("Asset upload failed. Please try again later.");
            }
          }}
          ref={editorRef}
        />
      )}
    />
  );
});
