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

import { useRef } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType } from "@plane/types";
import { Input } from "@plane/ui";
import { cn, getDescriptionPlaceholderI18n, isEditorEmpty } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { getNestedError } from "@/helpers/react-hook-form.helper";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web hooks
import { validateWhitespaceI18n } from "@/components/templates/settings/common";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";

type TUseMobxData = {
  usePropsForAdditionalData: false;
};

type TUsePropsData = {
  memberIds: string[];
  usePropsForAdditionalData: true;
};

type TWorkItemBlueprintDetailsProps<T extends FieldValues> = {
  assetEntityType?: EFileAssetType;
  fieldPaths: {
    name: FieldPath<T>;
    description: FieldPath<T>;
  };
  inputBorderVariant?: "primary" | "true-transparent";
  inputTextSize?: "md" | "lg";
  placeholders?: {
    name?: string;
    description?: string;
  };
  projectId: string | undefined | null;
  validation?: {
    nameRequired?: string;
    nameMaxLength?: string;
  };
  workspaceSlug: string;
} & (TUseMobxData | TUsePropsData);

export function WorkItemBlueprintDetails<T extends FieldValues>(props: TWorkItemBlueprintDetailsProps<T>) {
  const {
    assetEntityType = EFileAssetType.ISSUE_DESCRIPTION,
    fieldPaths,
    inputBorderVariant = "true-transparent",
    inputTextSize = "md",
    placeholders,
    projectId,
    usePropsForAdditionalData,
    validation,
    workspaceSlug,
  } = props;
  // refs
  const issueTitleRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<EditorRefApi>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    project: { getProjectMemberIds: getProjectMemberIdsFromStore },
  } = useMember();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const projectMemberIds = usePropsForAdditionalData
    ? props.memberIds
    : projectId
      ? getProjectMemberIdsFromStore(projectId, true)
      : [];
  // use editor mention search
  const { searchEntity } = useEditorMentionSearch({
    memberIds: projectMemberIds ?? [],
  });
  // Get errors for the specific fields
  const nameError = getNestedError(errors, fieldPaths.name);

  if (!workspaceId) {
    return null;
  }

  return (
    <>
      {/* Work Item Title */}
      <div>
        <Controller
          control={control}
          name={fieldPaths.name}
          rules={{
            validate: (value: string) => {
              const result = validateWhitespaceI18n(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: validation?.nameRequired || t("templates.settings.form.work_item.name.validation.required"),
            maxLength: {
              value: 255,
              message: validation?.nameMaxLength || t("templates.settings.form.work_item.name.validation.maxLength"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id={fieldPaths.name}
              name={fieldPaths.name}
              type="text"
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              ref={issueTitleRef || ref}
              hasError={Boolean(nameError)}
              placeholder={placeholders?.name || t("templates.settings.form.work_item.name.placeholder")}
              className={cn("w-full", {
                "p-0": inputBorderVariant === "true-transparent",
                "text-h5-bold": inputTextSize === "lg",
                "text-body-sm-regular": inputTextSize === "md",
              })}
              mode={inputBorderVariant}
            />
          )}
        />
        {nameError && typeof nameError.message === "string" && (
          <span className="text-caption-sm-medium text-danger-primary">{nameError.message}</span>
        )}
      </div>
      {/* Work Item Description */}
      <div className="space-y-1">
        <Controller
          name={fieldPaths.description}
          control={control}
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              editable
              id="work-item-description"
              initialValue={value ?? "<p></p>"}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceId}
              projectId={projectId || undefined}
              ref={editorRef}
              searchMentionCallback={searchEntity}
              onChange={(_description_json, description_html) => onChange(description_html)}
              placeholder={(isFocused, isEmpty) =>
                isEmpty
                  ? placeholders?.description || t("templates.settings.form.work_item.description.placeholder")
                  : t(`${getDescriptionPlaceholderI18n(isFocused, isEmpty)}`)
              }
              containerClassName={cn("min-h-[120px]", {
                "border border-subtle py-2": inputBorderVariant === "primary",
                "px-0": inputBorderVariant === "true-transparent",
              })}
              disabledExtensions={["image", "attachments"]}
              uploadFile={async (blockId, file) => {
                try {
                  const { asset_id } = await uploadEditorAsset({
                    blockId,
                    data: {
                      entity_identifier: "",
                      entity_type: assetEntityType,
                    },
                    file,
                    workspaceSlug: workspaceSlug || "",
                    projectId: projectId ?? undefined,
                  });
                  return asset_id;
                } catch (error) {
                  console.log("Error in uploading work item asset:", error);
                  throw new Error("Asset upload failed. Please try again later.");
                }
              }}
              duplicateFile={async (assetId: string) => {
                try {
                  const { asset_id } = await duplicateEditorAsset({
                    assetId,
                    entityType: assetEntityType,
                    projectId: projectId ?? undefined,
                    workspaceSlug: workspaceSlug || "",
                  });
                  return asset_id;
                } catch (error) {
                  console.log("Error in duplicating work item asset:", error);
                  throw new Error("Asset duplication failed. Please try again later.");
                }
              }}
            />
          )}
        />
      </div>
    </>
  );
}
