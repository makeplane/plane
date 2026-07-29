/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  control: Control<IModule>;
  initialValue: string;
  moduleId: string | undefined;
  projectId: string;
  tabIndex?: number;
  workspaceSlug: string;
};

export const ModuleDescriptionEditor = observer(function ModuleDescriptionEditor(props: Props) {
  const { control, initialValue, moduleId, projectId, tabIndex, workspaceSlug } = props;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // i18n
  const { t } = useTranslation();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;

  if (!workspaceId) return null;

  return (
    <Controller
      name="description_html"
      control={control}
      render={({ field: { onChange } }) => (
        <RichTextEditor
          editable
          id="module-modal-editor"
          initialValue={initialValue}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          onChange={(_description, description_html) => onChange(description_html)}
          tabIndex={tabIndex}
          placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
          searchMentionCallback={async (payload) =>
            await workspaceService.searchEntity(workspaceSlug, {
              ...payload,
              project_id: projectId,
            })
          }
          containerClassName="pt-3 min-h-[120px] border-[0.5px] border-subtle-1 rounded-lg"
          uploadFile={async (blockId, file) => {
            try {
              const { asset_id } = await uploadEditorAsset({
                blockId,
                data: {
                  entity_identifier: moduleId ?? "",
                  entity_type: EFileAssetType.MODULE_DESCRIPTION,
                },
                file,
                projectId,
                workspaceSlug,
              });
              return asset_id;
            } catch (error) {
              throw new Error("Asset upload failed. Please try again later.", { cause: error });
            }
          }}
          duplicateFile={async (assetId: string) => {
            try {
              const { asset_id } = await duplicateEditorAsset({
                assetId,
                entityId: moduleId,
                entityType: EFileAssetType.MODULE_DESCRIPTION,
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
  );
});
