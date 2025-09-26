"use client";

import { FC, useCallback, useEffect, useRef } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType } from "@plane/types";
import { Loader } from "@plane/ui";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { WorkspaceService } from "@/plane-web/services/workspace.service";
import { TProject } from "@/plane-web/types";
const workspaceService = new WorkspaceService();

export type ProjectDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  project: TProject;
  initialValue: string | undefined;
  disabled?: boolean;
  handleUpdate: (data: Partial<TProject>) => Promise<void>;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
};

export const ProjectDescriptionInput: FC<ProjectDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    workspaceSlug,
    project,
    disabled,
    initialValue,
    handleUpdate,
    setIsSubmitting,
    placeholder,
  } = props;
  // store hooks
  const { uploadEditorAsset } = useEditorAsset();
  // plane hooks
  const { t } = useTranslation();
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);

  const { handleSubmit, reset, control } = useForm<TProject>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TProject>) => {
      await handleUpdate({
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [handleUpdate]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!project) return;
    reset({
      id: project.id,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    // Reset unsaved changes flag when form is reset
    hasUnsavedChanges.current = false;
  }, [initialValue, reset]);

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
    [handleSubmit, project.id]
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
      {project?.description_html === undefined ? (
        <>
          <Loader className="min-h-[120px] max-h-64 space-y-2 overflow-hidden rounded-md ">
            <Loader.Item width="100%" height="22px" />
            <div className="flex items-center gap-2">
              <Loader.Item width="400px" height="22px" />
            </div>
            <div className="flex items-center gap-2">
              <Loader.Item width="400px" height="22px" />
            </div>
            <Loader.Item width="80%" height="22px" />
            <div className="flex items-center gap-2">
              <Loader.Item width="50%" height="22px" />
            </div>
            <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
              <Loader.Item width="100px" height="22px" />
              <Loader.Item width="50px" height="22px" />
            </div>
          </Loader>
        </>
      ) : (
        <>
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) => (
              <RichTextEditor
                editable={!disabled}
                id={project.id}
                initialValue={initialValue ?? ""}
                value={project?.description_html ?? null}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                projectId={project.id}
                searchMentionCallback={async (payload) =>
                  await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                    ...payload,
                    project_id: project.id,
                  })
                }
                dragDropEnabled
                onChange={(_description: object, description_html: string) => {
                  setIsSubmitting("submitting");
                  onChange(description_html);
                  hasUnsavedChanges.current = true;
                  debouncedFormSave();
                }}
                placeholder={
                  placeholder ? placeholder : (isFocused, value) => t(getDescriptionPlaceholderI18n(isFocused, value))
                }
                containerClassName={containerClassName}
                uploadFile={async (blockId, file) => {
                  try {
                    const { asset_id } = await uploadEditorAsset({
                      blockId,
                      data: {
                        entity_identifier: project.id,
                        entity_type: EFileAssetType.PROJECT_DESCRIPTION,
                      },
                      file,
                      projectId: project.id,
                      workspaceSlug,
                    });
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading project asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
              />
            )}
          />
        </>
      )}
    </>
  );
});
