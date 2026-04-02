/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
import { getDate, getDescriptionPlaceholderI18n, renderFormattedPayloadDate } from "@plane/utils";
import type { Release, ReleaseWrite } from "@plane/types";
import { EFileAssetType } from "@plane/types";

import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { RichTextEditor } from "@/components/editor/rich-text";
import { ReleaseStateDropdown } from "./release-state-dropdown";

import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";

import { DEFAULT_RELEASE_STATE } from "@/constants/release";

type Props = {
  workspaceSlug: string;
  releaseDetail?: Release;
  control: Control<ReleaseWrite>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  errors: FieldErrors<ReleaseWrite>;
  isSubmitting: boolean;
  handleClose: () => void;
  setValue: UseFormSetValue<ReleaseWrite>;
};

export const CreateUpdateReleaseForm = observer(function CreateUpdateReleaseForm(props: Props) {
  const { workspaceSlug, releaseDetail, control, handleSubmit, errors, isSubmitting, handleClose, setValue } = props;

  const { currentWorkspace } = useWorkspace();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const { t } = useTranslation();

  const { searchEntity } = useEditorMentionSearch({
    memberIds: workspaceMemberIds ?? [],
  });

  const isEdit = Boolean(releaseDetail?.id);

  const handleUploadFile = useCallback(
    async (blockId: string, file: File) => {
      try {
        const { asset_id } = await uploadEditorAsset({
          blockId,
          workspaceSlug,
          data: {
            entity_identifier: releaseDetail?.id ?? "",
            entity_type: EFileAssetType.RELEASE_DESCRIPTION,
          },
          file,
        });

        return asset_id;
      } catch (error) {
        console.error("Error uploading release asset:", error);
        throw new Error("Asset upload failed. Please try again later.");
      }
    },
    [uploadEditorAsset, workspaceSlug, releaseDetail?.id]
  );

  const handleDuplicateFile = useCallback(
    async (assetId: string) => {
      try {
        const { asset_id } = await duplicateEditorAsset({
          assetId,
          entityId: releaseDetail?.id,
          entityType: EFileAssetType.RELEASE_DESCRIPTION,
          workspaceSlug,
        });

        return asset_id;
      } catch (error) {
        console.error("Error duplicating release asset:", error);
        throw new Error("Asset duplication failed. Please try again later.");
      }
    },
    [duplicateEditorAsset, workspaceSlug, releaseDetail?.id]
  );

  if (!workspaceSlug || !currentWorkspace) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3 p-5 pb-4">
        <h3 className="text-18 font-medium text-secondary">
          {isEdit
            ? t("workspace_settings.settings.releases.update_release")
            : t("workspace_settings.settings.releases.create_release")}
        </h3>

        {/* Name Field */}
        <Controller
          control={control}
          name="name"
          rules={{
            required: t("name_is_required"),
            validate: (v) => v?.trim() !== "" || t("name_is_required"),
          }}
          render={({ field }) => (
            <div className="space-y-1">
              <Input
                {...field}
                id="name"
                type="text"
                value={field.value ?? ""}
                placeholder={t("releases.label", { count: 1 })}
                className="w-full text-14"
                hasError={Boolean(errors.name)}
              />
              {errors.name && <div className="text-danger-primary text-11">{errors.name.message}</div>}
            </div>
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description_json"
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              editable
              id="release-modal-editor"
              initialValue={value ?? "<p></p>"}
              workspaceSlug={workspaceSlug}
              workspaceId={currentWorkspace.id}
              dragDropEnabled={false}
              onChange={(json, html) => {
                onChange(json);
                setValue("description_html", html);
              }}
              placeholder={(isFocused, description) => t(`${getDescriptionPlaceholderI18n(isFocused, description)}`)}
              searchMentionCallback={searchEntity}
              containerClassName="min-h-24 border-[0.5px] border-subtle-1 rounded-md px-3 py-2"
              uploadFile={handleUploadFile}
              duplicateFile={handleDuplicateFile}
            />
          )}
        />

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <ReleaseStateDropdown
                value={field.value ?? DEFAULT_RELEASE_STATE}
                onChange={field.onChange}
                placeholder={t("state")}
              />
            )}
          />

          <Controller
            control={control}
            name="release_date"
            render={({ field }) => (
              <DateDropdown
                buttonVariant="border-with-text"
                className="h-7"
                value={getDate(field.value) || null}
                onChange={(val) => field.onChange(val ? renderFormattedPayloadDate(val) : null)}
                placeholder={t("target_date")}
              />
            )}
          />

          <div className="h-7">
            <Controller
              control={control}
              name="lead"
              render={({ field }) => (
                <MemberDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  multiple={false}
                  buttonVariant="border-with-text"
                  placeholder={t("lead")}
                  showUserDetails
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isEdit
            ? isSubmitting
              ? t("common.updating")
              : t("workspace_settings.settings.releases.update_release")
            : isSubmitting
              ? t("common.creating")
              : t("workspace_settings.settings.releases.create_release")}
        </Button>
      </div>
    </form>
  );
});
