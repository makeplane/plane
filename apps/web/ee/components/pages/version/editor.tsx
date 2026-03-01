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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import type { TDisplayConfig, TPrecomputedDiff } from "@plane/editor";
import { convertPrecomputedDiffToUint8Array, VersionDiffEditor } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TPage } from "@plane/types";
import { getEditorAssetDownloadSrc, getEditorAssetSrc } from "@plane/utils";
// components
import type { TVersionEditorProps } from "@/components/pages/version/editor";
import { VersionEditorSkeleton } from "@/components/pages/version/loader";
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// hooks
import { useUser } from "@/hooks/store/user";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePageFilters } from "@/hooks/use-page-filters";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
// plane web hooks
import { PageEmbedCardRoot } from "@/plane-web/components/pages";
import type { EPageStoreType as _EPageStoreType } from "@/plane-web/hooks/store";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

// Constants
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const WorkspacePagesVersionEditor = observer(function WorkspacePagesVersionEditor(props: TVersionEditorProps) {
  const {
    activeVersion,
    storeType,
    diffData,
    currentVersion,
    editors: _editors,
    versionsList,
    highlightChanges,
  } = props;
  // i18n
  const { t } = useTranslation();
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = useMemo(
    () => ({
      fontSize,
      fontStyle,
      wideLayout: true,
    }),
    [fontSize, fontStyle]
  );

  // Get sub pages data from versions list (for embed rendering)
  const subPagesDetails = useMemo(() => {
    if (!versionsList || !activeVersion) return [];
    const version = versionsList.find((v) => v.id === activeVersion);
    return version?.sub_pages_data ? (version.sub_pages_data as TPage[]) : [];
  }, [versionsList, activeVersion]);

  // use member
  const { getUserDetails: getMemberDetails } = useMember();

  // Callback to get user info for any userId (used by version diff tooltip)
  const getUserInfo = useCallback(
    (userId: string) => {
      const userDetails = getMemberDetails(userId);
      if (!userDetails) return null;
      return {
        id: userId,
        display_name: userDetails.display_name ?? "",
        avatar_url: userDetails.avatar_url,
        email: userDetails.email,
      };
    },
    [getMemberDetails]
  );

  // Convert base64 diff data to Uint8Array format for VersionDiffEditor
  // For plain mode (no highlight), we use identical snapshots so no changes are shown
  const precomputedDiff: TPrecomputedDiff | undefined = useMemo(() => {
    if (!diffData) return undefined;

    try {
      const converted = convertPrecomputedDiffToUint8Array(diffData);
      // When not highlighting changes, use newSnapshot for both old and new
      // This renders the content without any diff markers
      if (!highlightChanges) {
        return {
          ...converted,
          oldSnapshot: converted.newSnapshot,
        };
      }
      return converted;
    } catch {
      return undefined;
    }
  }, [highlightChanges, diffData]);

  // editor flagging
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug: workspaceSlug ?? "",
    projectId,
    storeType,
  });

  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    projectId,
    workspaceSlug,
  });

  // File handler config shared between both modes
  const fileHandlerConfig = useMemo(
    () => ({
      assetsUploadStatus: {},
      cancel: () => {},
      checkIfAssetExists: async (assetId: string) => {
        const res = await fileService.checkIfAssetExists(workspaceSlug?.toString() ?? "", assetId);
        return res?.exists ?? false;
      },
      delete: async () => {},
      getAssetDownloadSrc: async (path: string) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return (
          getEditorAssetDownloadSrc({
            assetId: path,
            projectId: projectId?.toString(),
            workspaceSlug: workspaceSlug?.toString() ?? "",
          }) ?? ""
        );
      },
      getAssetSrc: async (path: string) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return (
          getEditorAssetSrc({
            assetId: path,
            projectId: projectId?.toString(),
            workspaceSlug: workspaceSlug?.toString() ?? "",
          }) ?? ""
        );
      },
      restore: async (src: string) => {
        if (src?.startsWith("http")) {
          await fileService.restoreOldEditorAsset(currentWorkspace?.id ?? "", src);
        } else {
          await fileService.restoreNewAsset(workspaceSlug?.toString() ?? "", src);
        }
      },
      upload: () => Promise.resolve(""),
      duplicate: () => Promise.resolve(""),
      validation: {
        maxFileSize: MAX_FILE_SIZE_BYTES,
      },
    }),
    [workspaceSlug, projectId, currentWorkspace?.id]
  );

  // Mention handler config shared between both editor modes
  const mentionHandler = useMemo(
    () => ({
      renderComponent: EditorMentionsRoot,
      getMentionedEntityDetails: (id: string) => ({
        display_name: getMemberDetails(id)?.display_name ?? "",
      }),
    }),
    [getMemberDetails]
  );

  // Common extended editor props
  const commonExtendedEditorProps = useMemo(
    () => ({
      isSmoothCursorEnabled: false,
      embedHandler: {
        page: {
          widgetCallback: ({ pageId: pageIdFromNode }: { pageId: string }) => {
            if (!pageIdFromNode) return null;
            const pageDetails = subPagesDetails.find((page) => page.id === pageIdFromNode);
            return (
              <PageEmbedCardRoot
                embedPageId={pageIdFromNode}
                previewDisabled
                storeType={storeType}
                pageDetails={pageDetails}
                isDroppable={false}
              />
            );
          },
          workspaceSlug: workspaceSlug?.toString() ?? "",
        },
      },
    }),
    [subPagesDetails, storeType, workspaceSlug]
  );

  // Show loader while data is loading
  const isLoading = !currentVersion || !precomputedDiff;

  if (isLoading) {
    return <VersionEditorSkeleton />;
  }

  // Use VersionDiffEditor for both modes
  // When highlightChanges is false, precomputedDiff has identical snapshots (no diff markers)
  return (
    <div className="version-editor h-full [&_.frame-renderer]:!p-0 [&_.editor-container]:!border-none [&_.editor-container]:px-10 [&_.editor-container]:py-4">
      <VersionDiffEditor
        key={`version-${activeVersion}-${highlightChanges}`}
        id={activeVersion ?? currentVersion.id}
        precomputedDiff={precomputedDiff}
        currentVersionCreatedBy={currentVersion.created_by || currentVersion.owned_by}
        currentUserId={currentUser?.id}
        getUserInfo={getUserInfo}
        displayConfig={displayConfig}
        disabledExtensions={documentEditorExtensions.disabled}
        flaggedExtensions={documentEditorExtensions.flagged}
        fileHandler={fileHandlerConfig}
        getEditorMetaData={getEditorMetaData}
        mentionHandler={mentionHandler}
        extendedEditorProps={commonExtendedEditorProps}
        unknownUserText={t("unknown_user")}
      />
    </div>
  );
});
