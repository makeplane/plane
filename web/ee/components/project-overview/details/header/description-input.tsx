"use client";

import { FC, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { EFileAssetType } from "@plane/types/src/enums";

// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// services
import { TProject } from "@/plane-web/types";
import { FileService } from "@/services/file.service";
import { ProjectService } from "@/services/project";
const fileService = new FileService();
const projectService = new ProjectService();

export type ProjectDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  project: TProject;
  initialValue: string | undefined;
  disabled?: boolean;
  handleUpdate: (data: Partial<TProject>) => Promise<void>;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  swrProjectDescription?: string | null | undefined;
};

export const ProjectDescriptionInput: FC<ProjectDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    workspaceSlug,
    project,
    disabled,
    swrProjectDescription,
    initialValue,
    handleUpdate,
    setIsSubmitting,
    placeholder,
  } = props;

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
    [workspaceSlug, project.id, handleUpdate]
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
  }, [initialValue, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, project.id]
  );

  return (
    <>
      <Controller
        name="description_html"
        control={control}
        render={({ field: { onChange } }) =>
          !disabled ? (
            <RichTextEditor
              id={project.id}
              initialValue={initialValue ?? ""}
              value={swrProjectDescription ?? null}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceId}
              projectId={project.id}
              searchMentionCallback={async (payload) =>
                await projectService.searchEntity(workspaceSlug?.toString() ?? "", project.id, payload)
              }
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
                  const { asset_id } = await fileService.uploadProjectAsset(
                    workspaceSlug,
                    project.id,
                    {
                      entity_identifier: project.id,
                      entity_type: EFileAssetType.PROJECT_DESCRIPTION,
                    },
                    file
                  );
                  return asset_id;
                } catch (error) {
                  console.log("Error in uploading project asset:", error);
                  throw new Error("Asset upload failed. Please try again later.");
                }
              }}
            />
          ) : (
            <RichTextReadOnlyEditor
              id={project.id}
              initialValue={""}
              containerClassName={containerClassName}
              workspaceSlug={workspaceSlug}
              projectId={project.id}
            />
          )
        }
      />
    </>
  );
});
