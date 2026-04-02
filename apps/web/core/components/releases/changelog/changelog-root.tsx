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

import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { JSONContent } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { ERowVariant, Row } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { DocumentEditor } from "@/components/editor/document/editor";
import { PageToolbar } from "@/components/pages/editor/toolbar";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useReleases } from "@/hooks/store/use-releases";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  releaseId: string;
  workspaceSlug: string;
};

export const ReleaseChangelogRoot = observer(function ReleaseChangelogRoot({ releaseId, workspaceSlug }: Props) {
  // states
  const [isEditorReady, setIsEditorReady] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { getReleaseById } = useReleases().release;
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const release = getReleaseById(releaseId);
  const descriptionJSON = release?.changelog?.description_json;
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // file handlers
  const fileHandlers = useMemo(
    () =>
      getEditorFileHandlers({
        uploadFile: async (blockId, file) => {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            file,
            data: {
              entity_identifier: releaseId,
              entity_type: EFileAssetType.RELEASE_CHANGELOG,
            },
            workspaceSlug,
          });
          return asset_id;
        },
        duplicateFile: async (assetId: string) => {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: releaseId,
            entityType: EFileAssetType.RELEASE_CHANGELOG,
            workspaceSlug,
          });
          return asset_id;
        },
        workspaceId: workspaceId ?? "",
        workspaceSlug,
      }),
    [duplicateEditorAsset, getEditorFileHandlers, releaseId, uploadEditorAsset, workspaceId, workspaceSlug]
  );

  // Mutable ref holds the latest handler so the stable debounced function never goes stale.
  // The editor captures the onChange reference on init and never re-reads it, so a stable
  // reference is required here.
  const handleChangeRef = useRef<(descriptionJSON: JSONContent, descriptionHTML: string) => void>(() => {});
  handleChangeRef.current = (descriptionJSON: JSONContent, descriptionHTML: string) => {
    release?.updateChangelog({ description_json: descriptionJSON, description_html: descriptionHTML });
  };

  const debouncedHandleChange = useMemo(
    () =>
      debounce((descriptionJSON: JSONContent, descriptionHTML: string) => {
        handleChangeRef.current(descriptionJSON, descriptionHTML);
      }, 1500),
    []
  );

  useEffect(
    () => () => {
      debouncedHandleChange.flush();
    },
    [debouncedHandleChange]
  );

  useSWR(releaseId && release ? `RELEASE_CHANGELOG_${releaseId}` : null, () => release?.fetchChangelog(), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  if (!workspaceId) return null;

  if (!release || !descriptionJSON)
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  return (
    <div className="shrink-0 relative size-full flex flex-col overflow-hidden">
      {isEditorReady && editorRef.current && (
        <div className="shrink-0 w-full bg-layer-1 flex items-center min-h-10">
          <div className="relative w-fit page-toolbar-content px-page-x mx-auto">
            <PageToolbar editorRef={editorRef.current} />
          </div>
        </div>
      )}
      <Row
        className="relative size-full flex flex-col overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md mt-8"
        variant={ERowVariant.HUGGING}
      >
        <div id="page-content-container" className="relative w-full shrink-0">
          <DocumentEditor
            id={`release-changelog-${releaseId}`}
            ref={editorRef}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            editable={release.canEditChangelog}
            value={descriptionJSON}
            handleEditorReady={() => setIsEditorReady(true)}
            onChange={debouncedHandleChange}
            searchMentionCallback={async () => ({})}
            containerClassName="h-full p-0 pb-64 border-none"
            uploadFile={fileHandlers.upload}
            duplicateFile={fileHandlers.duplicate}
          />
        </div>
      </Row>
    </div>
  );
});
