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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TSearchEntityRequestPayload } from "@plane/types";
import { EFileAssetType } from "@plane/types";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";
const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId?: string;
  templateId: string | undefined;
  initialValue: string;
  onChange: (json: object, html: string) => void;
};

export const PageTemplateEditor = observer(function PageTemplateEditor(props: Props) {
  const { workspaceSlug, projectId, templateId, initialValue, onChange } = props;
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );

  return (
    <DocumentEditor
      disabledExtensions={["issue-embed"]}
      editable
      id="page-template-editor"
      value={initialValue}
      onChange={(json, html) => onChange(json, html)}
      containerClassName="min-h-[120px] border-none pl-4 -ml-4"
      uploadFile={async (blockId, file) => {
        const { asset_id } = await uploadEditorAsset({
          blockId,
          file,
          data: {
            entity_identifier: templateId ?? "",
            entity_type: EFileAssetType.PAGE_TEMPLATE_DESCRIPTION,
          },
          workspaceSlug: workspaceSlug,
        });
        return asset_id;
      }}
      duplicateFile={async (assetId: string) => {
        try {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: templateId ?? "",
            entityType: EFileAssetType.PAGE_TEMPLATE_DESCRIPTION,
            workspaceSlug: workspaceSlug,
          });
          return asset_id;
        } catch (error) {
          console.log("Error in duplicating page template asset:", error);
          throw new Error("Asset duplication failed. Please try again later.");
        }
      }}
      searchMentionCallback={async (payload: TSearchEntityRequestPayload) =>
        await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
          ...payload,
          project_id: projectId?.toString() ?? "",
        })
      }
      bubbleMenuEnabled
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
    />
  );
});
