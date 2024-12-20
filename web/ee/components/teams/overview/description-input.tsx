"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { TTeam, TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

export type TeamDescriptionInputProps = {
  initialValue: string | undefined;
  workspaceSlug: string;
  teamId: string;
  disabled?: boolean;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  containerClassName?: string;
};

export const TeamDescriptionInput: FC<TeamDescriptionInputProps> = observer((props) => {
  const { workspaceSlug, teamId, disabled, initialValue, placeholder, containerClassName } = props;
  // store hooks
  const { getTeamMemberIds, updateTeamNameDescriptionLoader, updateTeam } = useTeams();
  // derived values
  const teamMemberIds = getTeamMemberIds(teamId) ?? [];
  // use editor mention search
  const { searchEntity } = useEditorMentionSearch({
    memberIds: teamMemberIds,
  });

  const { handleSubmit, reset, control, setValue } = useForm<TTeam>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const [localTeamDescription, setLocalTeamDescription] = useState({
    id: teamId,
    description_html: initialValue,
  });

  const setIsSubmitting = (loaderType: TNameDescriptionLoader) => {
    updateTeamNameDescriptionLoader(teamId, loaderType);
  };

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TTeam>) => {
      await updateTeam(workspaceSlug, teamId, {
        description_html: formData.description_html ?? "<p></p>",
        description_json: formData.description_json,
      });
    },
    [updateTeam, workspaceSlug, teamId]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!teamId) return;
    reset({
      id: teamId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalTeamDescription({
      id: teamId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
  }, [initialValue, teamId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, teamId]
  );

  return (
    <>
      {localTeamDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) =>
            !disabled ? (
              <RichTextEditor
                id={teamId}
                initialValue={localTeamDescription.description_html ?? "<p></p>"}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                searchMentionCallback={searchEntity}
                dragDropEnabled
                onChange={(description_json: object, description_html: string) => {
                  setIsSubmitting("submitting");
                  onChange(description_html);
                  setValue("description_json", description_json);
                  debouncedFormSave();
                }}
                placeholder={
                  placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)
                }
                uploadFile={async (file) => {
                  try {
                    const { asset_id } = await fileService.uploadWorkspaceAsset(
                      workspaceSlug,
                      {
                        entity_identifier: teamId,
                        entity_type: EFileAssetType.TEAM_SPACE_DESCRIPTION,
                      },
                      file
                    );
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading issue asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
                containerClassName={containerClassName}
              />
            ) : (
              <RichTextReadOnlyEditor
                id={teamId}
                initialValue={localTeamDescription.description_html ?? ""}
                workspaceSlug={workspaceSlug}
                containerClassName={containerClassName}
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
