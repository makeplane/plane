"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { useTranslation } from "@plane/i18n";
import { TTeamspace, TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholderI18n } from "@/helpers/issue.helper";
// hooks
import { useEditorAsset, useWorkspace } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";

export type TeamspaceDescriptionInputProps = {
  initialValue: string | undefined;
  workspaceSlug: string;
  teamspaceId: string;
  disabled?: boolean;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  containerClassName?: string;
};

export const TeamspaceDescriptionInput: FC<TeamspaceDescriptionInputProps> = observer((props) => {
  const { workspaceSlug, teamspaceId, disabled, initialValue, placeholder, containerClassName } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceMemberIds, updateTeamspaceNameDescriptionLoader, updateTeamspace } = useTeamspaces();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const teamspaceMemberIds = getTeamspaceMemberIds(teamspaceId) ?? [];
  // use editor mention search
  const { searchEntity } = useEditorMentionSearch({
    memberIds: teamspaceMemberIds,
  });

  const { handleSubmit, reset, control, setValue } = useForm<TTeamspace>({
    defaultValues: {
      description_html: initialValue,
    },
  });

  const [localTeamspaceDescription, setLocalTeamspaceDescription] = useState({
    id: teamspaceId,
    description_html: initialValue,
  });

  const setIsSubmitting = (loaderType: TNameDescriptionLoader) => {
    updateTeamspaceNameDescriptionLoader(teamspaceId, loaderType);
  };

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<TTeamspace>) => {
      await updateTeamspace(workspaceSlug, teamspaceId, {
        description_html: formData.description_html ?? "<p></p>",
        description_json: formData.description_json,
      });
    },
    [updateTeamspace, workspaceSlug, teamspaceId]
  );

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!teamspaceId) return;
    reset({
      id: teamspaceId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
    setLocalTeamspaceDescription({
      id: teamspaceId,
      description_html: initialValue === "" ? "<p></p>" : initialValue,
    });
  }, [initialValue, teamspaceId, reset]);

  // ADDING handleDescriptionFormSubmit TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, teamspaceId]
  );

  return (
    <>
      {localTeamspaceDescription.description_html ? (
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) =>
            !disabled ? (
              <RichTextEditor
                id={teamspaceId}
                initialValue={localTeamspaceDescription.description_html ?? "<p></p>"}
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
                  placeholder ? placeholder : (isFocused, value) => t(getDescriptionPlaceholderI18n(isFocused, value))
                }
                uploadFile={async (blockId, file) => {
                  try {
                    const { asset_id } = await uploadEditorAsset({
                      blockId,
                      data: {
                        entity_identifier: teamspaceId,
                        entity_type: EFileAssetType.TEAM_SPACE_DESCRIPTION,
                      },
                      file,
                      workspaceSlug,
                    });
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading work item asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
                containerClassName={containerClassName}
              />
            ) : (
              <RichTextReadOnlyEditor
                id={teamspaceId}
                initialValue={localTeamspaceDescription.description_html ?? ""}
                workspaceId={workspaceId}
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
